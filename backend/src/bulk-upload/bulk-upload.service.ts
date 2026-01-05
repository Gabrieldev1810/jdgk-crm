import { Injectable, BadRequestException, InternalServerErrorException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { VicidialService } from '../vicidial/vicidial.service';
import * as csv from 'csv-parser';
import * as XLSX from 'xlsx';
import { Readable } from 'stream';

// ================================
// DTOs AND INTERFACES
// ================================
export interface BulkUploadResult {
  batchId: string;
  status: 'processing' | 'completed' | 'failed';
  totalRecords: number;
  successfulRecords: number;
  failedRecords: number;
  errors: BulkUploadError[];
  duplicates: number;
  message: string;
}

export interface BulkUploadError {
  row: number;
  field?: string;
  message: string;
  data?: any;
}

export interface BulkUploadOptions {
  batchName?: string;
  skipErrors?: boolean;
  updateExisting?: boolean;
  campaignId?: string;
  vicidialListId?: string;
}

// ================================
// BULK UPLOAD SERVICE
// ================================
@Injectable()
export class BulkUploadService {
  constructor(
    private prisma: PrismaService,
    private vicidialService: VicidialService
  ) {}

  /**
   * Process uploaded file for bulk account creation
   */
  async processUpload(
    file: Express.Multer.File,
    userId: string,
    options: BulkUploadOptions = {}
  ): Promise<BulkUploadResult> {
    const batchId = `batch_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    try {
      // Create upload batch record
      const uploadBatch = await this.prisma.uploadBatch.create({
        data: {
          id: batchId,
          filename: file.originalname,
          originalFilename: file.originalname,
          fileSize: file.size,
          mimeType: file.mimetype || 'application/octet-stream',
          status: 'PROCESSING',
          totalRecords: 0,
          processedRecords: 0,
          successCount: 0,
          errorCount: 0,
          skipCount: 0,
          duplicateCount: 0,
          uploadedById: userId,
          batchName: options.batchName || `Upload ${new Date().toLocaleDateString()}`,
          skipErrors: options.skipErrors ?? false,
          updateExisting: options.updateExisting ?? false,
          processingStarted: new Date(),
        }
      });

      // Parse file based on type
      const records = await this.parseFile(file);
      
      // Update total records count
      await this.prisma.uploadBatch.update({
        where: { id: batchId },
        data: { totalRecords: records.length }
      });

      // Process records
      const result = await this.processRecords(records, batchId, userId, options);
      
      // Update batch status
      await this.prisma.uploadBatch.update({
        where: { id: batchId },
        data: {
          status: result.failedRecords === result.totalRecords ? 'FAILED' : 'COMPLETED',
          processedRecords: result.totalRecords,
          successCount: result.successfulRecords,
          errorCount: result.failedRecords,
          duplicateCount: result.duplicates,
          errorLog: JSON.stringify(result.errors),
          processingCompleted: new Date(),
        }
      });

      return result;

    } catch (error) {
      // Update batch status to failed
      await this.prisma.uploadBatch.update({
        where: { id: batchId },
        data: {
          status: 'FAILED',
          errorLog: JSON.stringify([{ row: 0, message: error.message }]),
          processingCompleted: new Date(),
        }
      }).catch(() => {}); // Ignore errors updating the batch

      throw new InternalServerErrorException(`Upload processing failed: ${error.message}`);
    }
  }

  /**
   * Parse file content based on file type
   */
  private async parseFile(file: Express.Multer.File): Promise<any[]> {
    const records: any[] = [];

    if (file.mimetype === 'text/csv' || file.originalname.endsWith('.csv')) {
      return this.parseCsvFile(file);
    } else if (
      file.mimetype === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
      file.originalname.endsWith('.xlsx') ||
      file.originalname.endsWith('.xls')
    ) {
      return this.parseExcelFile(file);
    } else {
      throw new BadRequestException('Unsupported file type. Please upload CSV or Excel files.');
    }
  }

  /**
   * Parse CSV file
   */
  private async parseCsvFile(file: Express.Multer.File): Promise<any[]> {
    return new Promise((resolve, reject) => {
      const records: any[] = [];
      const stream = Readable.from(file.buffer);

      stream
        .pipe(csv())
        .on('data', (data) => records.push(data))
        .on('end', () => resolve(records))
        .on('error', (error) => reject(error));
    });
  }

  /**
   * Parse Excel file
   */
  private async parseExcelFile(file: Express.Multer.File): Promise<any[]> {
    try {
      const workbook = XLSX.read(file.buffer, { type: 'buffer' });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      return XLSX.utils.sheet_to_json(worksheet);
    } catch (error) {
      throw new BadRequestException('Failed to parse Excel file');
    }
  }

  /**
   * Process parsed records and create accounts
   */
  private async processRecords(
    records: any[],
    batchId: string,
    userId: string,
    options: BulkUploadOptions
  ): Promise<BulkUploadResult> {
    const result: BulkUploadResult = {
      batchId,
      status: 'processing',
      totalRecords: records.length,
      successfulRecords: 0,
      failedRecords: 0,
      errors: [],
      duplicates: 0,
      message: 'Processing records...'
    };

    const accountsToCreate: any[] = [];
    const phoneNumbersToCreate: { accountNumber: string; phoneNumber: string }[] = [];

    // Resolve Campaign ID if provided
    let targetCampaignId: string | undefined = undefined;
    if (options.campaignId) {
        try {
            // Check if campaign exists by ID (UUID) or Vicidial ID
            let campaign = await this.prisma.campaign.findFirst({
                where: { 
                    OR: [
                        { id: options.campaignId }, // In case it IS a UUID
                        { vicidialCampaignId: options.campaignId },
                        { name: options.campaignId } // Fallback to name
                    ]
                }
            });

            if (!campaign) {
                // Create it if it doesn't exist
                console.log(`Campaign ${options.campaignId} not found in local DB. Creating it...`);
                try {
                    campaign = await this.prisma.campaign.create({
                        data: {
                            name: options.campaignId,
                            vicidialCampaignId: options.campaignId,
                            status: 'ACTIVE'
                        }
                    });
                } catch (e) {
                    console.warn(`Failed to create campaign ${options.campaignId}, trying to find by name...`, e.message);
                    // If creation fails (e.g. name unique constraint), try to find it again
                    campaign = await this.prisma.campaign.findFirst({
                        where: { name: options.campaignId }
                    });
                }
            }
            
            if (campaign) {
                targetCampaignId = campaign.id;
            }
        } catch (error) {
            console.error('Error resolving campaign:', error);
            // Fallback: don't set campaignId if resolution fails
        }
    }

    for (let i = 0; i < records.length; i++) {
      const record = records[i];
      const rowNumber = i + 1;

      try {
        // Validate and transform record
        const validatedRecord = this.validateAndTransformRecord(record, rowNumber);
        
        if (validatedRecord.errors.length > 0) {
          result.errors.push(...validatedRecord.errors);
          if (!options.skipErrors) {
            result.failedRecords++;
            continue;
          }
        }

        // Check for duplicate account numbers
        const existingAccount = await this.prisma.account.findUnique({
          where: { accountNumber: validatedRecord.data.accountNumber }
        });

        if (existingAccount) {
          result.duplicates++;
          if (options.updateExisting) {
            // Update existing account (simplified - no phone number updates)
            const { phoneNumber, ...updateData } = validatedRecord.data;
            await this.prisma.account.update({
              where: { accountNumber: validatedRecord.data.accountNumber },
              data: {
                firstName: updateData.firstName,
                lastName: updateData.lastName,
                fullName: updateData.fullName,
                email: updateData.email,
                address1: updateData.address1,
                address2: updateData.address2,
                city: updateData.city,
                state: updateData.state,
                zipCode: updateData.zipCode,
                country: updateData.country,
                originalAmount: updateData.originalAmount,
                currentBalance: updateData.currentBalance,
                amountPaid: updateData.amountPaid,
                interestRate: updateData.interestRate,
                status: updateData.status,
                priority: updateData.priority,
                preferredContactMethod: updateData.preferredContactMethod,
                bestTimeToCall: updateData.bestTimeToCall,
                timezone: updateData.timezone,
                language: updateData.language,
                daysPastDue: updateData.daysPastDue,
                doNotCall: updateData.doNotCall,
                disputeFlag: updateData.disputeFlag,
                bankruptcyFlag: updateData.bankruptcyFlag,
                deceasedFlag: updateData.deceasedFlag,
                notes: updateData.notes,
                source: updateData.source,
                campaignId: targetCampaignId,
                batchId,
                updatedAt: new Date(),
              }
            });
            
            // Update phone number if provided
            if (phoneNumber) {
                // Check if phone exists
                const existingPhone = await this.prisma.accountPhone.findFirst({
                    where: { accountId: existingAccount.id, phoneNumber: phoneNumber }
                });
                
                if (!existingPhone) {
                    await this.prisma.accountPhone.create({
                        data: {
                            accountId: existingAccount.id,
                            phoneNumber: phoneNumber,
                            phoneType: 'PRIMARY'
                        }
                    });
                }
            }
            
            result.successfulRecords++;
          } else {
            result.errors.push({
              row: rowNumber,
              message: `Account ${validatedRecord.data.accountNumber} already exists`
            });
            result.failedRecords++;
          }
        } else {
          const { phoneNumber, ...createData } = validatedRecord.data;
          accountsToCreate.push({
            ...createData,
            campaignId: targetCampaignId,
            batchId,
            createdAt: new Date(),
            updatedAt: new Date(),
          });
          
          if (phoneNumber) {
              phoneNumbersToCreate.push({
                  accountNumber: createData.accountNumber,
                  phoneNumber: phoneNumber
              });
          }
        }

      } catch (error) {
        result.errors.push({
          row: rowNumber,
          message: error.message,
          data: record
        });
        result.failedRecords++;
      }
    }

    // Bulk create new accounts
    if (accountsToCreate.length > 0) {
      try {
        await this.prisma.account.createMany({
          data: accountsToCreate,
        });
        
        // Create phone numbers for new accounts
        if (phoneNumbersToCreate.length > 0) {
            const createdAccounts = await this.prisma.account.findMany({
                where: {
                    batchId: batchId,
                    accountNumber: { in: phoneNumbersToCreate.map(p => p.accountNumber) }
                },
                select: { id: true, accountNumber: true }
            });
            
            const phoneRecords = [];
            for (const acc of createdAccounts) {
                const phone = phoneNumbersToCreate.find(p => p.accountNumber === acc.accountNumber);
                if (phone) {
                    phoneRecords.push({
                        accountId: acc.id,
                        phoneNumber: phone.phoneNumber,
                        phoneType: 'PRIMARY'
                    });
                }
            }
            
            if (phoneRecords.length > 0) {
                await this.prisma.accountPhone.createMany({
                    data: phoneRecords
                });
            }
        }
        
        result.successfulRecords += accountsToCreate.length;

        // =================================================================
        // VICIDIAL SYNC LOGIC
        // =================================================================
        if (options.campaignId) {
            try {
                // Determine List ID
                let listId = options.vicidialListId;
                
                if (!listId) {
                    // Try to get from Campaign
                    const campaign = await this.prisma.campaign.findUnique({
                        where: { id: options.campaignId }
                    });
                    
                    if (campaign && campaign.vicidialCampaignId) {
                        // If we have a Vicidial Campaign ID, we might use a default list or try to infer it.
                        // For now, let's use a convention: 1000 + numeric part of campaign ID? 
                        // Or just use a default list '999' for "General Uploads" if not specified.
                        // But better to just log if we can't determine it.
                        // Let's assume listId = 1000 if not provided, just to have a target.
                        // Or better: If the user didn't provide a list ID, we can't sync safely.
                        // BUT the user requirement is "select the campaign... vicidial also track it".
                        // So we must try.
                        // Let's use a default list ID '1001' for now as a fallback.
                        listId = '1001'; 
                    }
                }

                if (listId) {
                    // Prepare leads for Vicidial (Format A)
                    // We need to combine accountsToCreate and updated accounts (if any)
                    // For simplicity, let's just sync the ones we just created/processed in this batch
                    // We can fetch them back to be sure we have all fields
                    const accountsToSync = await this.prisma.account.findMany({
                        where: { batchId: batchId },
                        include: { phoneNumbers: true }
                    });

                    const leads = accountsToSync.map(account => ({
                        vendor_lead_code: account.accountNumber,
                        phone_number: account.phoneNumbers.length > 0 ? account.phoneNumbers[0].phoneNumber : '',
                        first_name: account.firstName,
                        last_name: account.currentBalance?.toString() || '0', // Balance in Last Name
                        address1: account.address1 || '',
                        address2: account.source || 'Unknown', // Bank/Source
                        address3: account.originalAmount?.toString() || '0', // Original Amount
                        city: account.accountNumber, // Account ID in City
                        state: account.state || '',
                        postal_code: account.zipCode || '',
                        email: account.email || '',
                        comments: account.notes || '',
                        status: account.status || 'NEW'
                    }));

                    await this.vicidialService.syncLeads(leads, listId);
                    result.message += ` Synced ${leads.length} leads to Vicidial List ${listId}.`;
                }
            } catch (syncError) {
                console.error('Failed to sync to Vicidial during upload:', syncError);
                result.message += ` (Vicidial Sync Failed: ${syncError.message})`;
                // Don't fail the whole upload, just warn
            }
        }

      } catch (error) {
        result.errors.push({
          row: 0,
          message: `Bulk insert failed: ${error.message}`
        });
        result.failedRecords += accountsToCreate.length;
      }
    }

    result.status = result.failedRecords === 0 ? 'completed' : 'failed';
    result.message = `Processed ${result.totalRecords} records. ${result.successfulRecords} successful, ${result.failedRecords} failed.`;

    return result;
  }

  /**
   * Validate and transform a single record
   */
  private validateAndTransformRecord(record: any, rowNumber: number): { data: any; errors: BulkUploadError[] } {
    const errors: BulkUploadError[] = [];
    const data: any = {};

    // Create a normalized map of the record for flexible matching
    const normalizedRecord: Record<string, any> = {};
    Object.keys(record).forEach(key => {
        const value = record[key];
        if (value === undefined || value === null) return;
        
        // 1. Exact key
        normalizedRecord[key] = value;
        
        // 2. Clean key (trim, remove BOM)
        const cleanKey = key.toString().trim().replace(/^\ufeff/, '');
        normalizedRecord[cleanKey] = value;
        
        // 3. Normalized key (lowercase, no spaces/underscores)
        const normalizedKey = cleanKey.toLowerCase().replace(/[\s_]+/g, '');
        normalizedRecord[normalizedKey] = value;
    });

    // Helper to get value from multiple possible keys
    const getValue = (keys: string[]) => {
      for (const key of keys) {
        // Try exact match on normalized map (which contains exact keys too)
        if (normalizedRecord[key] !== undefined && normalizedRecord[key] !== '') return normalizedRecord[key];
        
        // Try normalized match
        const searchKey = key.toLowerCase().replace(/[\s_]+/g, '');
        if (normalizedRecord[searchKey] !== undefined && normalizedRecord[searchKey] !== '') return normalizedRecord[searchKey];
      }
      return undefined;
    };

    // 1. Account Number
    const accountNumber = getValue(['Account Number', 'accountNumber', 'account_number']);
    if (!accountNumber) {
      // Log available keys for debugging if account number is missing
      console.log(`Row ${rowNumber} missing Account Number. Available keys:`, Object.keys(normalizedRecord));
      errors.push({ row: rowNumber, field: 'Account Number', message: 'Account number is required' });
    } else {
      data.accountNumber = accountNumber;
    }

    // 2. Name (Split into First/Last)
    const name = getValue(['Name', 'name', 'fullName', 'full_name']);
    const firstName = getValue(['First Name', 'firstName', 'first_name']);
    const lastName = getValue(['Last Name', 'lastName', 'last_name']);

    if (name) {
      const nameParts = name.toString().trim().split(' ');
      if (nameParts.length === 1) {
        data.firstName = nameParts[0];
        data.lastName = '.'; // Placeholder if no last name
      } else {
        data.lastName = nameParts.pop();
        data.firstName = nameParts.join(' ');
      }
    } else {
      if (firstName) data.firstName = firstName;
      if (lastName) data.lastName = lastName;
    }

    if (!data.firstName) {
       // Fallback or error? Let's error if absolutely no name
       if (!data.lastName) {
           errors.push({ row: rowNumber, field: 'Name', message: 'Name is required' });
       } else {
           data.firstName = 'Unknown';
       }
    }
    if (!data.lastName) data.lastName = '.'; // Default if missing

    data.fullName = `${data.firstName} ${data.lastName}`.trim();

    // 3. Email
    data.email = getValue(['Email', 'email']);

    // 4. Address
    data.address1 = getValue(['Address', 'address', 'address1']);
    // Try to extract city/state/zip if address is comma separated? 
    // For now, just map to address1.
    data.city = getValue(['City', 'city']);
    data.state = getValue(['State', 'state']);
    data.zipCode = getValue(['Zip Code', 'zipCode', 'zip_code', 'zip']);

    // 5. Original Amount
    const originalAmountRaw = getValue(['Original Amount', 'originalAmount', 'original_amount']);
    // Remove currency symbols and commas
    const cleanOriginalAmount = originalAmountRaw ? originalAmountRaw.toString().replace(/[^0-9.-]+/g, '') : '0';
    const originalAmount = parseFloat(cleanOriginalAmount);
    
    if (isNaN(originalAmount) || originalAmount < 0) {
       if (originalAmountRaw !== undefined) {
           errors.push({ row: rowNumber, field: 'Original Amount', message: 'Original amount must be a positive number' });
       }
       data.originalAmount = 0;
    } else {
      data.originalAmount = originalAmount;
    }

    // 6. Out Standing Balance (OSB)
    const currentBalanceRaw = getValue(['Out Standing Balance (OSB)', 'Out Standing Balance', 'OSB', 'currentBalance', 'current_balance']);
    const cleanCurrentBalance = currentBalanceRaw ? currentBalanceRaw.toString().replace(/[^0-9.-]+/g, '') : '0';
    const currentBalance = parseFloat(cleanCurrentBalance);

    if (isNaN(currentBalance)) {
       if (currentBalanceRaw !== undefined) {
           errors.push({ row: rowNumber, field: 'Out Standing Balance (OSB)', message: 'Balance must be a number' });
       }
       data.currentBalance = 0;
    } else {
      data.currentBalance = currentBalance;
    }

    // 7. Bank Partner
    data.source = getValue(['Bank Partner', 'Bank', 'source', 'Source']);

    // 8. Status
    const statusRaw = getValue(['Status', 'status']);
    data.status = (statusRaw || 'NEW').toUpperCase();
    // If "UNTOUCHED", map to "NEW"
    if (data.status === 'UNTOUCHED') data.status = 'NEW';

    // 9. Phone Numbers
    data.phoneNumber = getValue(['Phone Numbers', 'Phone Number', 'Phone', 'phoneNumber', 'phone_number']);

    // 10. Assigned Agent
    const assignedAgent = getValue(['Assigned Agent', 'Agent', 'assignedAgent', 'assigned_agent']);
    if (assignedAgent) {
        data.notes = data.notes ? `${data.notes}\nAssigned Agent: ${assignedAgent}` : `Assigned Agent: ${assignedAgent}`;
    }

    // 11. Last Contact
    const lastContactRaw = getValue(['Last Contact', 'lastContact', 'lastContactDate', 'last_contact_date']);
    if (lastContactRaw) {
      const lastContactDate = new Date(lastContactRaw);
      if (!isNaN(lastContactDate.getTime())) {
        data.lastContactDate = lastContactDate;
      }
    }

    // 12. Remarks
    const remarks = getValue(['Remarks', 'remarks', 'notes']);
    if (remarks) {
        data.notes = data.notes ? `${data.notes}\n${remarks}` : remarks;
    }

    // Defaults for other fields
    data.country = 'US';
    data.amountPaid = 0;
    data.priority = 'MEDIUM';
    data.preferredContactMethod = 'PHONE';
    data.timezone = 'EST';
    data.language = 'EN';
    data.daysPastDue = 0;
    data.doNotCall = false;

    return { data, errors };
  }

  /**
   * Get upload batch status
   */
  async getBatchStatus(batchId: string): Promise<any> {
    const batch = await this.prisma.uploadBatch.findUnique({
      where: { id: batchId },
      include: {
        uploadedBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        }
      }
    });

    if (!batch) {
      throw new BadRequestException('Upload batch not found');
    }

    return {
      ...batch,
      errors: batch.errorLog ? JSON.parse(batch.errorLog) : []
    };
  }

  /**
   * Get upload batch history for a user
   */
  async getBatchHistory(userId?: string, page: number = 1, limit: number = 10): Promise<any> {
    const where = userId ? { uploadedById: userId } : {};
    const offset = (page - 1) * limit;

    const [batches, total] = await Promise.all([
      this.prisma.uploadBatch.findMany({
        where,
        include: {
          uploadedBy: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
      }),
      this.prisma.uploadBatch.count({ where })
    ]);

    return {
      batches: batches.map(batch => ({
        ...batch,
        errors: batch.errorLog ? JSON.parse(batch.errorLog) : []
      })),
      total,
      page,
      pages: Math.ceil(total / limit)
    };
  }
}
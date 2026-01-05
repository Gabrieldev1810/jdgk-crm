# VICIdial Agent Mapping Analysis

## Current Status
We analyzed the leads in VICIdial and the Users in the CRM to check for assignment gaps.

### Mapped Agents (Working)
The following agents are correctly mapped in the CRM. Leads assigned to these VICIdial users will be assigned to the corresponding CRM User.

| VICIdial ID | Agent Name | CRM User | Leads Count |
|-------------|------------|----------|-------------|
| 1002 | ROMEO AMG | asuncionreymart30@gmail.com | 2,173 |
| 2002 | TM WARREN FLEXI | admin@dialcraft.com | (No leads currently assigned in top list) |

### Missing Agents (Not Mapped)
The following VICIdial users have leads assigned to them but **do not exist** in the CRM (or don't have their `vicidialUserId` set). Leads for these agents will currently be unassigned in the CRM.

| VICIdial ID | Agent Name | Leads Count | Action Needed |
|-------------|------------|-------------|---------------|
| 2001 | KYLA AMG | 4,339 | Create User / Map ID |
| 1003 | CHARMAINE AMG | 3,243 | Create User / Map ID |
| 1009 | LOYD AMG | 2,893 | Create User / Map ID |
| 2003 | JAIDELLE FLEXI | 1,648 | Create User / Map ID |
| 2007 | ELLA FLX | 1,477 | Create User / Map ID |
| 1007 | KIAN FL | 1,375 | Create User / Map ID |
| 1001 | ANNA AMG | 1,273 | Create User / Map ID |
| 1008 | RANDY FLEXI | 853 | Create User / Map ID |
| 2004 | ANGEL FL | 727 | Create User / Map ID |
| 1010 | ANDREI | 651 | Create User / Map ID |
| 1004 | TL JOAN FL | 611 | Create User / Map ID |
| 2005 | AXEL AIQON | 528 | Create User / Map ID |
| 1000 | ALLEN FL | 449 | Create User / Map ID |
| 2009 | GILBERTFLEX | 434 | Create User / Map ID |
| 2008 | CHESCAFLEX | 390 | Create User / Map ID |
| 1005 | KEN FL | 197 | Create User / Map ID |
| 2000 | ATAZAR FL | 105 | Create User / Map ID |
| 1006 | ERNIE AMG | 48 | Create User / Map ID |
| 2006 | RAYZA FLX | 38 | Create User / Map ID |

## Recommendation
To fix the assignment issue, we need to create CRM Users for these agents and set their `vicidialUserId`.

I can create a script to automatically import these agents into the CRM with:
- **Email:** `agent{ID}@dialcraft.com` (e.g., agent2001@dialcraft.com)
- **Password:** `Welcome123!`
- **Role:** `AGENT`
- **Name:** Parsed from VICIdial full name.

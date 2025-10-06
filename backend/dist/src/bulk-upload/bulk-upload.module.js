"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.BulkUploadModule = void 0;
const common_1 = require("@nestjs/common");
const bulk_upload_controller_1 = require("./bulk-upload.controller");
const bulk_upload_service_1 = require("./bulk-upload.service");
const prisma_module_1 = require("../prisma/prisma.module");
let BulkUploadModule = class BulkUploadModule {
};
exports.BulkUploadModule = BulkUploadModule;
exports.BulkUploadModule = BulkUploadModule = __decorate([
    (0, common_1.Module)({
        imports: [prisma_module_1.PrismaModule],
        controllers: [bulk_upload_controller_1.BulkUploadController],
        providers: [bulk_upload_service_1.BulkUploadService],
        exports: [bulk_upload_service_1.BulkUploadService],
    })
], BulkUploadModule);
//# sourceMappingURL=bulk-upload.module.js.map
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UpdateCallDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const create_call_dto_1 = require("./create-call.dto");
class UpdateCallDto extends (0, swagger_1.PartialType)(create_call_dto_1.CreateCallDto) {
}
exports.UpdateCallDto = UpdateCallDto;
//# sourceMappingURL=update-call.dto.js.map
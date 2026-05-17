import { Global, Module } from '@nestjs/common';
import { ListAccessService } from './list-access.service';

@Global()
@Module({
  providers: [ListAccessService],
  exports: [ListAccessService],
})
export class ListAccessModule {}

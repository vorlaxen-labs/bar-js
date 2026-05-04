import { IMetadata } from '../interfaces/IResponse.interface';
import { CryptoUtil } from '../utils/crypto.util';

export type MetadataOptions = Partial<IMetadata> & Record<string, any>;

export class MetadataFactory {
  public static create(
    options: MetadataOptions = {},
    context?: {
      request_id?: string;
    }
  ): IMetadata {
    return {
      request_id: context?.request_id ?? CryptoUtil.generateUUID(),
      server_time: new Date().toISOString(),
      status_code: 200,
      ...options,
    };
  }
}
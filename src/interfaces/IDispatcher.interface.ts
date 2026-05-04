export interface IBaRDispatcher {
  dispatch(result: BaRFinalResult): any;
}

export interface BaRFinalResult {
  body: {
    success: boolean;
    message: string;
    data: any;
    timestamp: string;
    metadata: any;
  };
  statusCode: number;
  headers: Record<string, any>;
}
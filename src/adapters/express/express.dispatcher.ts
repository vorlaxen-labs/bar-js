import { BaRFinalResult, IBaRDispatcher, Logger } from "../../interfaces";
import { shouldSendResponseBody } from "../../constants/http.constant";
import { BarExpressResponse } from "./express.types";

export class ExpressDispatcher implements IBaRDispatcher {
  constructor(
    private res: BarExpressResponse,
    private logger?: Logger,
  ) {}

  dispatch(result: BaRFinalResult): BaRFinalResult {
    if (this.res.headersSent) {
      this.logger?.warn?.("BaR dispatch skipped: response headers already sent", {
        statusCode: result.statusCode,
      });
      return result;
    }

    for (const [k, v] of Object.entries(result.headers)) {
      this.res.setHeader(k, v);
    }

    if (result.cookies?.length) {
      for (const cookie of result.cookies) {
        this.res.cookie(cookie.name, cookie.value, cookie.options || {});
      }
    }

    this.res.status(result.statusCode);

    if (shouldSendResponseBody(result.statusCode)) {
      this.res.json(result.body);
    } else {
      this.res.end();
    }

    return result;
  }
}

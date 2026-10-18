import { BaRFinalResult, IBaRDispatcher, Logger } from "../../interfaces";
import { shouldSendResponseBody } from "../../constants/http.constant";
import { BarFastifyReply } from "./fastify.types";

export class FastifyDispatcher implements IBaRDispatcher {
  constructor(
    private reply: BarFastifyReply,
    private logger?: Logger,
  ) {}

  dispatch(result: BaRFinalResult): BaRFinalResult {
    if (this.reply.sent || this.reply.raw.headersSent) {
      this.logger?.warn?.("BaR dispatch skipped: response headers already sent", {
        statusCode: result.statusCode,
      });
      return result;
    }

    for (const [k, v] of Object.entries(result.headers)) {
      this.reply.header(k, v);
    }

    if (result.cookies?.length) {
      if (typeof this.reply.setCookie !== "function") {
        this.logger?.warn?.(
          "BaR dispatch: cookies skipped — register @fastify/cookie on your Fastify instance",
        );
      } else {
        for (const cookie of result.cookies) {
          this.reply.setCookie!(cookie.name, cookie.value, cookie.options || {});
        }
      }
    }

    this.reply.status(result.statusCode);

    if (shouldSendResponseBody(result.statusCode)) {
      this.reply.send(result.body);
    } else {
      this.reply.send();
    }

    return result;
  }
}

import { Controller, Get, Header } from "@nestjs/common";
import { AllowAnonymous } from "@thallesp/nestjs-better-auth";
import { register } from "prom-client";

@AllowAnonymous()
@Controller("metrics")
export class MetricsController {
  @Get()
  @AllowAnonymous()
  @Header("Content-Type", register.contentType)
  async index(): Promise<string> {
    return register.metrics();
  }
}

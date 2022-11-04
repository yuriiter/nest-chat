import { Controller, Get, Param, Req, Res, UseGuards } from "@nestjs/common";
import { Request, Response } from "express";

import { AssetsService } from "./assets.service";
import { JwtGuard } from "../auth/guard/jwt.guard";

@Controller("chat_assets")
@UseGuards(JwtGuard)
export class AssetsController {
  constructor(private readonly assetsService: AssetsService) {}

  @Get(":directory_name/:asset_name")
  findOne(
    @Param("directory_name") directoryName: string,
    @Param("asset_name") assetName: string,
    @Req() req: Request,
    @Res() res: Response
  ) {
    return this.assetsService.findOne(
      directoryName,
      assetName,
      +req.user.id,
      res
    );
  }
}

import { JwtPayload } from "jsonwebtoken";
import { Request } from "express";
export interface AuthRequest extends Request {
  payload?: JwtPayload;
}

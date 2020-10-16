import { Site } from "../models";

declare module "nunjucks" {
  export interface Environment {
    site: Site
  }
}
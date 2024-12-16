import { Service } from "fornax/core";

@Service("ApiService")
export class ApiService {
  getData() {
    return "Welcome to Fornax!";
  }
}

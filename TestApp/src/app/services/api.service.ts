import { Service } from "fornaxjs";

@Service("ApiService")
export class ApiService {
  getData() {
    return "Welcome to Fornax!";
  }
}

import { addRouter } from "fornaxjs";
import { HelloWorld } from "./app/components/hello-world.component";
import { Other } from "./app/components/other.component";

export const routes: any[] = [
  { path: "/", component: HelloWorld },
  { path: "/other", component: Other },
];

addRouter("router-outlet", routes);

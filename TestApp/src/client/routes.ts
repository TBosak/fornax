import { addRouter } from "fornaxjs";
import { HelloWorld } from "./app/components/hello-world.component";
import { Other } from "./app/components/other.component";

export const routes: any[] = [
  { path: "/", component: HelloWorld },
  { path: "/other/:id", component: Other },
  { path: "/test", component: Other, canActivate: myCustomGuard },
];

addRouter("router-outlet", routes);

function myCustomGuard(context: any, commands: any) {
  alert("You are not allowed here!");
  return commands.redirect("/other/1");
}

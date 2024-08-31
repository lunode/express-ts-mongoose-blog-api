import { Request, Application, Handler } from "express";
import HttpErrors from "http-errors";
import path from "path";
interface routeNotMatchOptions {
  // 静态资源目录, 当url 404时, 需要判断是否是静态资源404, 还是api接口 method没实现
  staticPath: string[];
}
interface Layer {
  path: string;
  handle: {
    stack: Layer[];
  };
  route?: {
    path: string;
    methods: {
      [key: string]: boolean;
    };
  };
  name: string | undefined;
  regexp: RegExp | undefined;
}
export default function routeNotMatch(
  app: Application,
  options: routeNotMatchOptions
): Handler {
  // express layer.path 为 undefined 坑
  const routeMap: any = {
    isLoaded: false,
  };
  // 扁平化所有app的路由
  // const mapRoute = function (arr: Layer[]) {
  //   routeMap.isLoaded = true;
  //   const recursion = function (arr: Layer[], pathArr: string[]) {
  //     arr.forEach((layer) => {
  //       if (layer.route) {
  //         routeMap[path.join(...pathArr) + layer.route.path] =
  //           layer.route.methods;
  //       } else if (layer.name == "router") {
  //         recursion(
  //           layer.handle.stack,
  //           layer.path
  //             ? [...pathArr, layer.path]
  //             : layer.regexp
  //             ? [
  //                 ...pathArr,
  //                 path
  //                   .normalize(
  //                     layer.regexp.source.replace(/[\\\?\$\(\)\=\|\^]/g, "")
  //                   )
  //                   .replace(/\/$/, ""),
  //               ]
  //             : pathArr
  //         );
  //       }
  //     });
  //   };
  //   recursion(arr, []);
  // };
  return function (req: Request) {
    if (!routeMap.isLoaded) {
      // 一定要在运行时运行mapRoute函数, 这样才能获取到所有路由的中间件
      // mapRoute(
      //   app._router.stack.filter((layer: Layer) => layer.path) as Layer[]
      // );
    }
    const staticPath = options.staticPath || [];
    // 如果是静态资源路径的404, 直接返回 Not Found
    if (staticPath.find((path) => req.path.indexOf(path) == 0)) {
      console.log(req.path, "静态资源不存在");
      throw HttpErrors.NotFound();
    }
    // 判断是否是 route url, 并查找对应的 method有没有实现
    const route = routeMap[req.path];
    if (!route) {
      console.log(req.path, "路由不存在");
      throw HttpErrors.NotFound();
    }
    const method = req.method.toLowerCase();
    if (!route[method]) {
      console.log(req.path, "method不存在");
      throw HttpErrors.NotImplemented(
        method.toUpperCase() + " " + req.path + " " + "Not Implemented"
      );
    }
    // 兜底
    throw HttpErrors.NotFound();
  };
}

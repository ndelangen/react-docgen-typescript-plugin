import path from "node:path";
import { exec } from "node:child_process";
import webpack from "webpack";
import ReactDocgenTypeScriptPlugin from "..";

function compile(): Promise<string> {
  return new Promise((resolve, reject) => {
    webpack({
      mode: "production",
      entry: { main: "./src/__tests__/index.ts" },
      output: {
        path: path.join(process.cwd(), "test-output"),
        module: true,
        libraryTarget: "module",
      },
      experiments: {
        outputModule: true,
      },
      externals: {
        tslib: "tslib",
        react: "react",
        "react-dom": "react-dom",
      },
      optimization: {
        minimize: false,
      },
      plugins: [new ReactDocgenTypeScriptPlugin()],
      module: {
        rules: [
          {
            test: /\.tsx?$/,
            loader: "ts-loader",
            options: {
              transpileOnly: true,
            },
          },
        ],
      },
    }).run((error, stats) => {
      if (error) {
        return reject(error);
      }

      if (stats?.hasErrors()) {
        return reject(stats.toString("errors-only"));
      }

      return resolve(stats?.toString() ?? "");
    });
  });
}

test("default options", async () => {
  await compile();

  const process = exec(
    "node --experimental-strip-types src/__tests__/check.ts"
  );

  const out = await new Promise<string>((resolve) => {
    let data = "";
    process.stdout?.on("data", (d) => {
      data += d?.toString() ?? "";
    });
    process.stdout?.on("end", () => {
      resolve(data);
    });
  });

  expect(JSON.parse(out)).toMatchSnapshot();
}, 9000);

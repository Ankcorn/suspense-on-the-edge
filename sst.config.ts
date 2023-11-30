import { Tags } from "aws-cdk-lib/core";
import { SSTConfig,  } from "sst";
import { Config, Function} from 'sst/constructs'

export default {
  config(_input) {
    return {
      name: "lambda",
      // region: 'eu-west-2'
      region: "us-west-1",
    };
  },
  stacks(app) {
    app.setDefaultFunctionProps({
      runtime: "nodejs18.x",
      memorySize: "1 GB"
    })
    app.stack((ctx) => {

      const DATABASE_HOST = new Config.Secret(ctx.stack, "DATABASE_HOST");
      const DATABASE_USERNAME = new Config.Secret(ctx.stack, "DATABASE_USERNAME");
      const DATABASE_PASSWORD = new Config.Secret(ctx.stack, "DATABASE_PASSWORD");

      const func = new Function(ctx.stack, "aws", {
        handler: "src/index.handler",
        url: true,
        bind: [DATABASE_HOST, DATABASE_USERNAME, DATABASE_PASSWORD],
        tracing: 'disabled',
      });
      ctx.stack.addOutputs({
        url: func.url,
      });
    })

    Tags.of(app).add("baselime:tracing", "true");
 
  }
} satisfies SSTConfig;

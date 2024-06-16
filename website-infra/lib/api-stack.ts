import * as cdk from 'aws-cdk-lib';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';

export class ApiStack extends cdk.Stack {
  constructor(scope: cdk.App, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // Create a DynamoDB table
    const counterTable = new dynamodb.Table(this, 'CounterTable', {
      partitionKey: { name: 'id', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
    });

    // Create a Lambda function
    const counterFunction = new lambda.Function(this, 'CounterFunction', {
        runtime: lambda.Runtime.PYTHON_3_12,
        handler: 'api_handler.lambda_handler',
        code: lambda.Code.fromAsset('../backend'),
        environment: {
            COUNTER_TABLE_NAME: counterTable.tableName,
        },
    });

    // Grant the Lambda function read/write permissions to the DynamoDB table
    counterTable.grantReadWriteData(counterFunction);

    // Create an API Gateway REST API
    const api = new apigateway.RestApi(this, 'CounterApi', {
      restApiName: 'Counter API',
      description: 'API for managing a counter',
      defaultCorsPreflightOptions: {
        allowOrigins: apigateway.Cors.ALL_ORIGINS,
        allowMethods: apigateway.Cors.ALL_METHODS,
        allowHeaders: [
          'Content-Type',
          'X-Amz-Date',
          'Authorization',
          'X-Api-Key',
          'X-Amz-Security-Token',
          'X-Amz-User-Agent'
        ]
      }
    });

    // Create a resource for the getCounter API
    const getCounterResource = api.root.addResource('getCounter');
    getCounterResource.addMethod('GET', new apigateway.LambdaIntegration(counterFunction));

    // Create a resource for the incrementCounter API
    const incrementCounterResource = api.root.addResource('incrementCounter');
    incrementCounterResource.addMethod('POST', new apigateway.LambdaIntegration(counterFunction));
  }
}

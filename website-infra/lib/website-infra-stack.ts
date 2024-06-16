import * as iam from 'aws-cdk-lib/aws-iam';
import * as acm from 'aws-cdk-lib/aws-certificatemanager';
import * as cloudfront from 'aws-cdk-lib/aws-cloudfront';
import * as cdk from 'aws-cdk-lib';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as s3Deployment from 'aws-cdk-lib/aws-s3-deployment';
import * as origins from 'aws-cdk-lib/aws-cloudfront-origins';
import * as targets from 'aws-cdk-lib/aws-route53-targets';
import * as route53 from 'aws-cdk-lib/aws-route53';

import { Construct } from 'constructs';
// import * as sqs from 'aws-cdk-lib/aws-sqs';

export class WebsiteInfraStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const bucket = new s3.Bucket(this, 'ResumeBucket', {
      bucketName: 'shivika-aws-resume-bucket', // Replace with your desired bucket name
      websiteIndexDocument: 'index.html',
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      blockPublicAccess: {
        blockPublicAcls: false,
        blockPublicPolicy: false,
        ignorePublicAcls: false,
        restrictPublicBuckets: false,
      },
      cors: [
        {
          allowedOrigins: ['*'],
          allowedMethods: [s3.HttpMethods.GET,s3.HttpMethods.HEAD],
          allowedHeaders: ['*'],
          exposedHeaders: [],
          maxAge: 3000
        }
      ],
      encryption: s3.BucketEncryption.S3_MANAGED,
      //enforceSSL: true,
      versioned: true
    });

    const public_policy = new iam.PolicyStatement({
      actions: ['s3:GetObject'],
      effect: iam.Effect.ALLOW,
      principals: [new iam.AnyPrincipal()],
      resources: [bucket.arnForObjects('*')],
    });
    
    bucket.addToResourcePolicy(public_policy);

    new s3Deployment.BucketDeployment(this, 'ResumeWebsite', {
      sources: [s3Deployment.Source.asset('../website')], // Path to your website files
      destinationBucket: bucket
    });

     // Create a Route 53 hosted zone
     const existingHostedZone = route53.HostedZone.fromHostedZoneAttributes(this, 'ExistingHostedZone', {
      hostedZoneId: 'Z09549923DW0G3Z8SHS2N', 
      zoneName: 'shivikasingh.com'
    });

    const certificate = new acm.DnsValidatedCertificate(this, 'CrossRegionCertificate', {
      domainName: '*.shivikasingh.com',
      hostedZone: existingHostedZone,
      region: 'us-east-1',
    });

    const distribution = new cloudfront.Distribution(this, 'CF Distribution', {
      defaultBehavior: { 
        origin: new origins.S3Origin(bucket),
        viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
      },
      domainNames: ['www.shivikasingh.com'],
      certificate: certificate,
    });    
    

    new route53.ARecord(this, 'AliasRecord', {
      recordName: 'www.shivikasingh.com', 
      target: route53.RecordTarget.fromAlias(new targets.CloudFrontTarget(distribution)),
      zone: existingHostedZone,
    });
    

    new cdk.CfnOutput(this, 'ResumeWebsiteURL', {
      value: bucket.bucketWebsiteUrl,
      description: 'Resume Website URL'
    });
    
  }
}

import os
import boto3
from boto3.dynamodb.conditions import Key

dynamodb = boto3.resource('dynamodb')
table_name = os.environ['COUNTER_TABLE_NAME']
table = dynamodb.Table(table_name)


def lambda_handler(event, context):
    http_method = event['httpMethod']
    path = event['path']

    if http_method == 'GET' and path == '/getCounter':
        return get_counter()
    elif http_method == 'POST' and path == '/incrementCounter':
        return increment_counter()
    else:
        return {
            'statusCode': 404,
            'body': 'Not found',
            'headers' : {
                'Access-Control-Allow-Origin' : '*'
            } 
        }

def get_counter():
    response = table.get_item(
        Key={
            'id': 'counter'
        }
    )
    
    if 'Item' in response:
        value = response['Item']['value']
    else:
        value = 0
    
    return {
        'statusCode': 200,
        'body': str(value),
        'headers' : {
            'Access-Control-Allow-Origin' : '*'
        } 
    }

def increment_counter():
    response = table.update_item(
        Key={
            'id': 'counter'
        },
        UpdateExpression='SET #value = if_not_exists(#value, :start) + :inc',
        ExpressionAttributeNames={
            '#value': 'value'
        },
        ExpressionAttributeValues={
            ':start': 0,
            ':inc': 1
        },
        ReturnValues='UPDATED_NEW'
    )
    
    new_value = response['Attributes']['value']
    
    return {
        'statusCode': 200,
        'body': str(new_value),
        'headers' : {
            'Access-Control-Allow-Origin' : '*'
        } 
    }

import { BetaAnalyticsDataClient } from '@google-analytics/data';
import path from 'path';

/**
 * GA4 Metrics fetcher
 * Note: Requires GA_PROPERTY_ID in .env and the credentials JSON to be functional.
 */

// Google Analytics credentials
const propertyId = process.env.GA_PROPERTY_ID;
const serviceAccountJson = process.env.GA_SERVICE_ACCOUNT_JSON;
const credentialsPath = path.resolve(process.cwd(), 'client', 'src', 'docs', 'joiner-web-view-c73f3fd0b12b.json');

let clientOptions: any = {};

if (serviceAccountJson) {
  try {
    clientOptions.credentials = JSON.parse(serviceAccountJson);
  } catch (e) {
    console.error('[GA API] Failed to parse GA_SERVICE_ACCOUNT_JSON:', e);
  }
} else {
  clientOptions.keyFilename = credentialsPath;
}

const analyticsDataClient = new BetaAnalyticsDataClient(clientOptions);

export async function getGaMetrics() {
  if (!propertyId) {
    console.warn('[GA API] GA_PROPERTY_ID is not defined in .env');
    return null;
  }

  try {
    const [response] = await analyticsDataClient.runReport({
      property: `properties/${propertyId}`,
      dateRanges: [
        {
          startDate: '7daysAgo',
          endDate: 'today',
        },
      ],
      metrics: [
        {
          name: 'activeUsers',
        },
        {
          name: 'screenPageViews',
        },
        {
          name: 'engagementRate',
        }
      ],
    });

    // Parse the response
    const values = response.rows?.[0]?.metricValues || [];
    return {
       activeUsers: values[0]?.value || '0',
       pageViews: values[1]?.value || '0',
       engagementRate: values[2]?.value ? (parseFloat(values[2].value) * 100).toFixed(1) + '%' : '0%',
    };
  } catch (error) {
    console.error('[GA API] Error fetching metrics:', error);
    return null;
  }
}

export async function getTopEvents() {
  if (!propertyId) return null;

  try {
    const [response] = await analyticsDataClient.runReport({
      property: `properties/${propertyId}`,
      dateRanges: [
        {
          startDate: '7daysAgo',
          endDate: 'today',
        },
      ],
      dimensions: [
        {
          name: 'eventName',
        },
      ],
      metrics: [
        {
          name: 'eventCount',
        },
      ],
      limit: 5,
    });

    return response.rows?.map(row => ({
      name: row.dimensionValues?.[0]?.value,
      count: row.metricValues?.[0]?.value,
    })) || [];
  } catch (error) {
    console.error('[GA API] Error fetching top events:', error);
    return null;
  }
}

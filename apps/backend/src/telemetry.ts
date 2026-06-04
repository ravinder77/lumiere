import { diag, DiagConsoleLogger, DiagLogLevel } from '@opentelemetry/api';
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node';
import { OTLPLogExporter } from '@opentelemetry/exporter-logs-otlp-http';
import {
  AggregationTemporalityPreference,
  OTLPMetricExporter,
} from '@opentelemetry/exporter-metrics-otlp-http';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';
import { resourceFromAttributes } from '@opentelemetry/resources';
import { BatchLogRecordProcessor } from '@opentelemetry/sdk-logs';
import { PeriodicExportingMetricReader } from '@opentelemetry/sdk-metrics';
import { NodeSDK } from '@opentelemetry/sdk-node';
import { BatchSpanProcessor } from '@opentelemetry/sdk-trace-base';
import {
  ATTR_DEPLOYMENT_ENVIRONMENT_NAME,
  ATTR_SERVICE_NAME,
  ATTR_SERVICE_VERSION,
} from '@opentelemetry/semantic-conventions';

const serviceName = process.env.OTEL_SERVICE_NAME ?? 'lumiere-backend';
const serviceVersion = process.env.npm_package_version ?? '1.0.0';
const deploymentEnvironment = process.env.NODE_ENV ?? 'development';
const otlpEndpoint = (process.env.OTEL_EXPORTER_OTLP_ENDPOINT ?? 'http://localhost:4318').replace(/\/$/, '');

if (process.env.OTEL_LOG_LEVEL) {
  diag.setLogger(new DiagConsoleLogger(), DiagLogLevel.INFO);
}

function signalEndpoint(signal: 'traces' | 'metrics' | 'logs') {
  const envName = `OTEL_EXPORTER_OTLP_${signal.toUpperCase()}_ENDPOINT`;
  return process.env[envName] ?? `${otlpEndpoint}/v1/${signal}`;
}

const sdk = new NodeSDK({
  resource: resourceFromAttributes({
    [ATTR_SERVICE_NAME]: serviceName,
    [ATTR_SERVICE_VERSION]: serviceVersion,
    [ATTR_DEPLOYMENT_ENVIRONMENT_NAME]: deploymentEnvironment,
  }),
  spanProcessors: [
    new BatchSpanProcessor(
      new OTLPTraceExporter({
        url: signalEndpoint('traces'),
      })
    ),
  ],
  metricReaders: [
    new PeriodicExportingMetricReader({
      exporter: new OTLPMetricExporter({
        url: signalEndpoint('metrics'),
        temporalityPreference: AggregationTemporalityPreference.CUMULATIVE,
      }),
      exportIntervalMillis: Number(process.env.OTEL_METRIC_EXPORT_INTERVAL_MS ?? 30000),
    }),
  ],
  logRecordProcessors: [
    new BatchLogRecordProcessor(
      new OTLPLogExporter({
        url: signalEndpoint('logs'),
      })
    ),
  ],
  instrumentations: [
    getNodeAutoInstrumentations({
      '@opentelemetry/instrumentation-fs': {
        enabled: false,
      },
      '@opentelemetry/instrumentation-pino': {
        disableLogSending: false,
        disableLogCorrelation: false,
        logKeys: {
          traceId: 'trace_id',
          spanId: 'span_id',
          traceFlags: 'trace_flags',
        },
      },
    }),
  ],
});

sdk.start();

function shutdownTelemetry(signal: NodeJS.Signals) {
  sdk
    .shutdown()
    .catch((error) => {
      console.error('OpenTelemetry shutdown failed', error);
    })
    .finally(() => {
      process.kill(process.pid, signal);
    });
}

process.once('SIGTERM', shutdownTelemetry);
process.once('SIGINT', shutdownTelemetry);

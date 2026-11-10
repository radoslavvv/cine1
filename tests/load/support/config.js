export const fixture = JSON.parse(open(__ENV.FIXTURE));
export const base = __ENV.BASE_URL;
export const peak = Number(__ENV.PEAK_RATE || 50);
export const stage = `${Number(__ENV.STAGE_SECONDS || 30)}s`;

if (!/^https:\/\/127\.0\.0\.1:\d+$/.test(base)) {
  throw new Error('Only the isolated loopback HTTPS API is accepted.');
}

export const commonOptions = {
  insecureSkipTLSVerify: true,
  // CSRF cookies belong to each simulated customer and persist across its requests.
  noCookiesReset: true,
  summaryTrendStats: ['avg', 'min', 'med', 'p(95)', 'p(99)', 'max'],
  systemTags: ['status', 'method', 'name', 'scenario', 'expected_response'],
};

export function handleSummary(data) {
  return { [__ENV.SUMMARY]: JSON.stringify(data, null, 2) };
}

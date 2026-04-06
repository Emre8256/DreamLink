export interface AppReleaseConfig {
  ios: {
    bundleIdentifier: string;
    buildNumber: string;
  };
  android: {
    package: string;
    versionCode: number;
  };
  permissions: {
    microphone: string;
    speechRecognition: string;
  };
}

export const validateAppReleaseConfig = (config: Partial<AppReleaseConfig>): config is AppReleaseConfig => {
  return !!(
    config.ios?.bundleIdentifier &&
    config.ios?.buildNumber &&
    config.android?.package &&
    typeof config.android?.versionCode === 'number' &&
    config.permissions?.microphone &&
    config.permissions?.speechRecognition
  );
};

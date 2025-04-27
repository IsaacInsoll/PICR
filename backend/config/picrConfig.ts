import { IPicrConfiguration } from './IPicrConfiguration';
import { testUrl } from '../../tests/testVariables';

export const picrConfig: IPicrConfiguration = {
  baseUrl: testUrl,
  cachePath: '',
  mediaPath: '',
  updateMetadata: false,
  pollingInterval: 20, //sensible default
};

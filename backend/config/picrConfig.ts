import { IPicrConfiguration } from './IPicrConfiguration.js';
import { testUrl } from '../../tests/testVariables.js';

export const picrConfig: IPicrConfiguration = {
  baseUrl: '',
  cachePath: '',
  mediaPath: '',
  updateMetadata: false,
  pollingInterval: 20, //sensible default
};

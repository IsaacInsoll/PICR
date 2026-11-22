import { afterEach, expect, test, vi } from 'vitest';

const probe = async (
  formats: string,
  { missingMagick = false, failedList = false } = {},
) => {
  vi.resetModules();
  const config = {
    exiftoolPath: '/tools/exiftool',
    magickPath: '/tools/magick',
    mediaCaps: {},
  };
  const spawnSync = vi.fn((command: string, args: string[]) => {
    if (command === config.exiftoolPath) return { status: 0, stdout: '13.00' };
    if (args[0] === '-version') {
      return {
        status: missingMagick ? 1 : 0,
        stdout: 'Version: ImageMagick 7.1.2-0',
      };
    }
    return { status: failedList ? 1 : 0, stdout: formats };
  });
  vi.doMock('node:child_process', () => ({ spawnSync }));
  vi.doMock('../../backend/config/picrConfig.js', () => ({
    picrConfig: config,
  }));
  const { checkOptionalMediaTools } =
    await import('../../backend/boot/checkOptionalMediaTools');
  checkOptionalMediaTools();
  return { config, spawnSync };
};

afterEach(() => {
  vi.restoreAllMocks();
  vi.resetModules();
});

test.each([
  ['rw+', true],
  ['r--', true],
  ['-w+', false],
  ['---', false],
])(
  'requires JXL read support rather than just an installed coder (%s)',
  async (mode, expected) => {
    const { config, spawnSync } = await probe(
      `  JXL* JXL ${mode} JPEG XL\n  HEIC HEIC rw+ HEIC`,
    );
    expect(config.mediaCaps).toMatchObject({ jxl: expected, heic: true });
    expect(spawnSync).toHaveBeenCalledWith(
      '/tools/magick',
      ['-list', 'format'],
      { encoding: 'utf8' },
    );
  },
);

test('missing ImageMagick disables its capabilities without disabling RAW', async () => {
  const { config, spawnSync } = await probe('JXL* JXL rw+ JPEG XL', {
    missingMagick: true,
  });
  expect(config.mediaCaps).toEqual({
    raw: true,
    psd: false,
    psb: false,
    heic: false,
    jxl: false,
  });
  expect(spawnSync).not.toHaveBeenCalledWith(
    '/tools/magick',
    ['-list', 'format'],
    expect.anything(),
  );
});

test('a failed or absent format listing does not advertise JXL', async () => {
  expect(
    (await probe('JXL* JXL rw+ JPEG XL', { failedList: true })).config
      .mediaCaps,
  ).toMatchObject({ jxl: false });
  expect((await probe('HEIC HEIC rw+ HEIC')).config.mediaCaps).toMatchObject({
    jxl: false,
    heic: true,
  });
});

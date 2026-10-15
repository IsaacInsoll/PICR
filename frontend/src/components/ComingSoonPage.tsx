import { Box, Button, Container, Stack, Text, Title } from '@mantine/core';
import { useTranslation } from 'react-i18next';
import { CameraIcon, RefreshIcon } from '../PicrIcons';
import { useDateFormatters } from '../i18n/useDateFormatters';
import { useNow } from '../hooks/useNow';
import { comingSoonCountdown } from './comingSoonCountdown';
import classes from './ComingSoonPage.module.css';

type ComingSoonPageProps = {
  galleryName?: string;
  estimatedDeliveryAt?: string;
  message?: string;
  onCheck?: () => void;
  checking?: boolean;
  preview?: boolean;
};

export const ComingSoonPage = ({
  galleryName,
  estimatedDeliveryAt,
  message,
  onCheck,
  checking = false,
  preview = false,
}: ComingSoonPageProps) => {
  const { t } = useTranslation('gallery');
  const { formatDate, formattingLocale } = useDateFormatters();
  const deliveryTime = estimatedDeliveryAt
    ? new Date(estimatedDeliveryAt).getTime()
    : Number.NaN;
  const hasEstimate = Number.isFinite(deliveryTime);
  const now = useNow(hasEstimate ? 1000 : 60_000);
  const countdown = hasEstimate ? comingSoonCountdown(deliveryTime, now) : null;
  const number = (value: number) =>
    new Intl.NumberFormat(formattingLocale, { minimumIntegerDigits: 2 }).format(
      value,
    );

  return (
    <Box className={`${classes.page} ${preview ? classes.preview : ''}`}>
      <Container size={820} className={classes.content}>
        <Stack align="center" gap="lg" ta="center">
          <Box className={classes.emblem} aria-hidden="true">
            <CameraIcon size={38} />
          </Box>
          <Text className={classes.eyebrow}>{t('comingSoon.eyebrow')}</Text>
          <Title order={1} className={classes.title}>
            {galleryName || t('comingSoon.defaultTitle')}
          </Title>
          <Text className={classes.subtitle}>
            {message?.trim() || t('comingSoon.description')}
          </Text>
          {hasEstimate && estimatedDeliveryAt ? (
            <Stack gap="xs" align="center" className={classes.estimate}>
              <Text className={classes.estimateLabel}>
                {t('comingSoon.estimatedDelivery')}
              </Text>
              <Text fw={600}>
                {formatDate(estimatedDeliveryAt, {
                  dateStyle: 'long',
                  timeStyle: 'short',
                })}
              </Text>
              {countdown?.remaining ? (
                <Box
                  className={classes.countdown}
                  aria-label={t('comingSoon.timeRemaining')}
                >
                  {countdown.days > 0 ? (
                    <Box className={classes.timeUnit}>
                      <Text className={classes.timeValue}>
                        {number(countdown.days)}
                      </Text>
                      <Text className={classes.timeLabel}>
                        {t('comingSoon.days')}
                      </Text>
                    </Box>
                  ) : null}
                  <Box className={classes.timeUnit}>
                    <Text className={classes.timeValue}>
                      {number(countdown.hours)}
                    </Text>
                    <Text className={classes.timeLabel}>
                      {t('comingSoon.hours')}
                    </Text>
                  </Box>
                  <Box className={classes.timeUnit}>
                    <Text className={classes.timeValue}>
                      {number(countdown.minutes)}
                    </Text>
                    <Text className={classes.timeLabel}>
                      {t('comingSoon.minutes')}
                    </Text>
                  </Box>
                  {countdown.showSeconds ? (
                    <Box className={classes.timeUnit}>
                      <Text
                        key={countdown.seconds}
                        className={`${classes.timeValue} ${classes.secondsValue}`}
                      >
                        {number(countdown.seconds)}
                      </Text>
                      <Text className={classes.timeLabel}>
                        {t('comingSoon.seconds')}
                      </Text>
                    </Box>
                  ) : null}
                </Box>
              ) : (
                <Text className={classes.checkBack}>
                  {t('comingSoon.checkBack')}
                </Text>
              )}
            </Stack>
          ) : null}
          {onCheck ? (
            <Button
              variant="light"
              leftSection={<RefreshIcon size={18} />}
              onClick={onCheck}
              loading={checking}
              className={classes.checkButton}
            >
              {t('comingSoon.checkNow')}
            </Button>
          ) : null}
        </Stack>
      </Container>
    </Box>
  );
};

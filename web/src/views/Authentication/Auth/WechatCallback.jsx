/**
 * 微信扫码登录回调页（对接 ref/wechat-login-demo 与 wechat-sso-bridge）
 * 在 iframe 内打开，从 URL 取得 code 后通过 postMessage 通知父页，由父页调用 /api/oauth/wechat?code=xxx 完成登录
 */
import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Box, Typography } from '@mui/material';
import { useTranslation } from 'react-i18next';

const MSG_TYPE = 'wechat-login-success';

const WechatCallback = () => {
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState('loading'); // loading | success | noCode

  useEffect(() => {
    const code = searchParams.get('code');
    if (!code) {
      setStatus('noCode');
      return;
    }
    try {
      if (window.parent && window.parent !== window) {
        window.parent.postMessage(
          {
            type: MSG_TYPE,
            code
          },
          window.location.origin
        );
      }
      setStatus('success');
    } catch (e) {
      setStatus('noCode');
    }
  }, [searchParams]);

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100%',
        p: 2,
        bgcolor: 'success.50'
      }}
    >
      {status === 'loading' && (
        <Typography color="text.secondary">{t('common.processing')}</Typography>
      )}
      {status === 'success' && (
        <Typography color="success.dark" fontWeight={500}>
          {t('login.wechatCallbackSuccess')}
        </Typography>
      )}
      {status === 'noCode' && (
        <Typography color="error.main">
          {t('login.wechatCallbackNoCode')}
        </Typography>
      )}
    </Box>
  );
};

export default WechatCallback;

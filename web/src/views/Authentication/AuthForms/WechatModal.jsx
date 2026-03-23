// WechatModal.js
import PropTypes from 'prop-types';
import React, { useEffect, useCallback } from 'react';
import { Dialog, DialogTitle, DialogContent, TextField, Button, Typography, Grid } from '@mui/material';
import { Formik, Form, Field } from 'formik';
import { showError } from 'utils/common';
import * as Yup from 'yup';
import { useTranslation } from 'react-i18next';

const MSG_TYPE_WECHAT_SUCCESS = 'wechat-login-success';

const getValidationSchema = (t) =>
  Yup.object().shape({
    code: Yup.string().required(t('login.codeRequired'))
  });

const WechatModal = ({ open, handleClose, wechatLogin, qrCode, wechatScanBase, mode }) => {
  const { t } = useTranslation();
  const useScanIframe = mode === 'scan';

  const handleMessage = useCallback(
    (event) => {
      if (event.origin !== window.location.origin) return;
      if (!event.data || event.data.type !== MSG_TYPE_WECHAT_SUCCESS) return;
      const code = event.data.code;
      if (!code) return;
      wechatLogin(code).then(({ success, message }) => {
        if (success) {
          handleClose();
        } else {
          showError(message || t('error.unknownError'));
        }
      });
    },
    [wechatLogin, handleClose, t]
  );

  useEffect(() => {
    if (!open || !useScanIframe) return;
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [open, useScanIframe, handleMessage]);

  const handleSubmit = async (values) => {
    const { success, message } = await wechatLogin(values.code);
    if (success) {
      handleClose();
    } else {
      showError(message || t('error.unknownError'));
    }
  };

  const callbackUrl = typeof window !== 'undefined' ? `${window.location.origin}/auth/wechat-callback` : '';
  const scanPageUrl = useScanIframe && callbackUrl
    ? `${wechatScanBase.replace(/\/$/, '')}/?redirect_uri=${encodeURIComponent(callbackUrl)}`
    : '';

  return (
    <Dialog open={open} onClose={handleClose} maxWidth={useScanIframe ? 'sm' : false}>
      <DialogTitle>
        {useScanIframe ? t('login.wechatScanLogin', '微信扫码登录') : t('login.wechatVerificationCodeLogin')}
      </DialogTitle>
      <DialogContent>
        {useScanIframe ? (
          <iframe
            title={t('login.wechatScanLogin', '微信扫码登录')}
            src={scanPageUrl}
            style={{
              width: '100%',
              minHeight: 420,
              border: 'none',
              borderRadius: 8
            }}
          />
        ) : (
          <Grid container direction="column" alignItems="center">
            <img src={qrCode} alt={t('login.qrCode')} style={{ maxWidth: '300px', maxHeight: '300px', width: 'auto', height: 'auto' }} />
            <Typography
              variant="body2"
              color="text.secondary"
              style={{ marginTop: '10px', textAlign: 'center', wordWrap: 'break-word', maxWidth: '300px' }}
            >
              {t('login.wechatLoginInfo')}
            </Typography>
            <Formik initialValues={{ code: '' }} validationSchema={getValidationSchema(t)} onSubmit={handleSubmit}>
              {({ errors, touched }) => (
                <Form style={{ width: '100%' }}>
                  <Grid item xs={12}>
                    <Field
                      as={TextField}
                      name="code"
                      label={t('common.verificationCode')}
                      error={touched.code && Boolean(errors.code)}
                      helperText={touched.code && errors.code}
                      fullWidth
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <Button type="submit" fullWidth>
                      {t('common.submit')}
                    </Button>
                  </Grid>
                </Form>
              )}
            </Formik>
          </Grid>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default WechatModal;

WechatModal.propTypes = {
  open: PropTypes.bool,
  handleClose: PropTypes.func,
  wechatLogin: PropTypes.func,
  qrCode: PropTypes.string,
  wechatScanBase: PropTypes.string,
  mode: PropTypes.oneOf(['code', 'scan'])
};

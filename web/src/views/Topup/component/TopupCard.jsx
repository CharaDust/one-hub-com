import {
  Typography,
  Stack,
  OutlinedInput,
  InputAdornment,
  Button,
  InputLabel,
  FormControl,
  useMediaQuery,
  Box,
  Grid,
  Divider,
  Badge,
  Select,
  MenuItem
} from '@mui/material';
import { IconBuildingBank } from '@tabler/icons-react';
import { useTheme } from '@mui/material/styles';
import SubCard from 'ui-component/cards/SubCard';
import UserCard from 'ui-component/cards/UserCard';
import AnimateButton from 'ui-component/extended/AnimateButton';
import { useSelector } from 'react-redux';
import PayDialog from './PayDialog';

import { useSearchParams } from 'react-router-dom';
import { API } from 'utils/api';
import React, { useEffect, useState, useMemo, useRef } from 'react';
import { showError, showInfo, showSuccess, renderQuota, trims } from 'utils/common';
import { useTranslation } from 'react-i18next';

// 充值金额预设：{ 金额: 显示名称 }
const TOPUP_AMOUNT_OPTIONS = [
  { value: 190, label: '特惠计划1' },
  { value: 390, label: '特惠计划2' },
  { value: 990, label: '特惠计划3' },
  { value: 2000, label: '计划1' },
  { value: 3000, label: '计划2' },
  { value: 5000, label: '计划3' }
];

// 超级管理员可见的测试金额（仅 role === 100 时显示）
const SUPER_ADMIN_TEST_OPTIONS = [
  { value: 1, label: '[测试]特惠计划' },
  { value: 2, label: '[测试]计划' }
];

const SUPER_ADMIN_ROLE = 100;

const TopupCard = () => {
  const { t } = useTranslation(); // Translation hook
  const theme = useTheme();
  const [searchParams, setSearchParams] = useSearchParams();
  const urlAmountRef = useRef(null); // 来自 URL 的金额，用于自动点击充值
  const [redemptionCode, setRedemptionCode] = useState('');
  const [userQuota, setUserQuota] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [payment, setPayment] = useState([]);
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [amount, setAmount] = useState(TOPUP_AMOUNT_OPTIONS[0].value);
  const [discountTotal, setDiscountTotal] = useState(0);
  const [open, setOpen] = useState(false);
  const [disabledPay, setDisabledPay] = useState(false);
  const matchDownSM = useMediaQuery(theme.breakpoints.down('md'));
  const siteInfo = useSelector((state) => state.siteInfo);
  const user = useSelector((state) => state.account?.user);
  const isSuperAdmin = user?.role === SUPER_ADMIN_ROLE;
  const amountOptions = useMemo(
    () => (isSuperAdmin ? [...TOPUP_AMOUNT_OPTIONS, ...SUPER_ADMIN_TEST_OPTIONS] : TOPUP_AMOUNT_OPTIONS),
    [isSuperAdmin]
  );
  const RechargeDiscount = useMemo(() => {
    if (siteInfo.RechargeDiscount === '') {
      return {};
    }
    try {
      return JSON.parse(siteInfo.RechargeDiscount);
    } catch (e) {
      return {};
    }
  }, [siteInfo.RechargeDiscount]);
  const topUp = async () => {
    if (redemptionCode === '') {
      showInfo(t('topupCard.inputPlaceholder'));
      return;
    }
    setIsSubmitting(true);
    try {
      const res = await API.post('/api/user/topup', {
        key: trims(redemptionCode)
      });
      const { success, message, data } = res.data;
      if (success) {
        showSuccess('充值成功！');
        setUserQuota((quota) => {
          return quota + data;
        });
        setRedemptionCode('');
      } else {
        showError(message);
      }
    } catch (err) {
      showError('请求失败');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePay = () => {
    if (!selectedPayment) {
      showError(t('topupCard.selectPaymentMethod'));
      return;
    }

    if (amount <= 0 || amount < siteInfo.PaymentMinAmount) {
      showError(`${t('topupCard.amountMinLimit')} ${siteInfo.PaymentMinAmount}`);
      return;
    }

    if (amount > 1000000) {
      showError(t('topupCard.amountMaxLimit'));
      return;
    }

    // 判读金额是否是正整数
    if (!/^[1-9]\d*$/.test(amount)) {
      showError(t('topupCard.positiveIntegerAmount'));
      return;
    }

    setDisabledPay(true);
    setOpen(true);
  };

  const onClosePayDialog = () => {
    setOpen(false);
    setDisabledPay(false);
  };

  const getPayment = async () => {
    try {
      let res = await API.get(`/api/user/payment`);
      const { success, data } = res.data;
      if (success) {
        if (data.length > 0) {
          data.sort((a, b) => b.sort - a.sort);
          setPayment(data);
          setSelectedPayment(data[0]);
        }
      }
    } catch (error) {
      return;
    }
  };

  const openTopUpLink = () => {
    if (!siteInfo.top_up_link) {
      showError(t('topupCard.adminSetupRequired'));
      return;
    }
    window.open(siteInfo.top_up_link, '_blank');
  };

  const getUserQuota = async () => {
    try {
      let res = await API.get(`/api/user/self`);
      const { success, message, data } = res.data;
      if (success) {
        setUserQuota(data.quota);
      } else {
        showError(message);
      }
    } catch (error) {
      return;
    }
  };

  const handlePaymentSelect = (payment) => {
    setSelectedPayment(payment);
  };

  const handleAmountChange = (event) => {
    const value = Number(event.target.value);
    handleSetAmount(value);
  };

  const handleSetAmount = (amount) => {
    amount = Number(amount);
    setAmount(amount);
    handleDiscountTotal(amount);
  };

  const calculateFee = () => {
    if (!selectedPayment) return 0;

    if (selectedPayment.fixed_fee > 0) {
      return Number(selectedPayment.fixed_fee); //固定费率不计算折扣
    }
    const discount = RechargeDiscount[amount] || 1; // 如果没有折扣，则默认为1（即没有折扣）
    let newAmount = amount * discount; //折后价格
    return parseFloat(selectedPayment.percent_fee * Number(newAmount)).toFixed(2);
  };

  const calculateTotal = () => {
    if (amount === 0) return 0;
    const discount = RechargeDiscount[amount] || 1; // 如果没有折扣，则默认为1（即没有折扣）
    let newAmount = amount * discount; //折后价格
    let total = Number(newAmount) + Number(calculateFee());
    if (selectedPayment && selectedPayment.currency === 'CNY') {
      total = parseFloat((total * siteInfo.PaymentUSDRate).toFixed(2));
    }
    return total;
  };

  const handleDiscountTotal = (amount) => {
    if (amount === 0) return 0;
    // 如果金额在RechargeDiscount中，则应用折扣,手续费和货币换算汇率不算在折扣内
    const discount = RechargeDiscount[amount] || 1; // 如果没有折扣，则默认为1（即没有折扣）
    console.log(amount, discount);
    setDiscountTotal(amount * discount);
  };

  // 初始化：拉取支付方式与余额
  useEffect(() => {
    getPayment().then();
    getUserQuota().then();
  }, []);

  // 从 URL 读取 amount 参数并自动选中金额（供外部带参跳转）
  useEffect(() => {
    const amountParam = searchParams.get('amount');
    if (!amountParam) return;
    const num = Number(amountParam);
    const valid = amountOptions.some((opt) => opt.value === num);
    if (valid) {
      handleSetAmount(num);
      urlAmountRef.current = num;
    }
  }, [searchParams, amountOptions]);

  // 当支付方式已加载且存在来自 URL 的金额时，自动打开充值弹窗并清除 URL 参数
  useEffect(() => {
    if (urlAmountRef.current == null || payment.length === 0 || !selectedPayment || amount !== urlAmountRef.current) {
      return;
    }
    urlAmountRef.current = null;
    setSearchParams({}, { replace: true }); // 清除 URL 中的 amount，避免刷新重复触发
    handlePay();
  }, [payment.length, selectedPayment, amount]);

  return (
    <UserCard>
      <Stack direction="row" alignItems="center" justifyContent="center" spacing={2} paddingTop={'20px'}>
        <IconBuildingBank color={theme.palette.primary.main} />
        <Typography variant="h4">{t('topupCard.currentQuota')}</Typography>
        <Typography variant="h4">{renderQuota(userQuota)}</Typography>
      </Stack>

      {payment.length > 0 && (
        <SubCard
          sx={{
            marginTop: '40px'
          }}
          title={t('topupCard.onlineTopup')}
        >
          <Stack spacing={2}>
            {payment.map((item, index) => (
              <AnimateButton key={index}>
                <Button
                  disableElevation
                  fullWidth
                  size="large"
                  variant="outlined"
                  onClick={() => handlePaymentSelect(item)}
                  sx={{
                    ...theme.typography.LoginButton,
                    border: selectedPayment === item ? `1px solid ${theme.palette.primary.main}` : '1px solid transparent'
                  }}
                >
                  <Box sx={{ mr: { xs: 1, sm: 2, width: 20 }, display: 'flex', alignItems: 'center' }}>
                    <img src={item.icon} alt="github" width={25} height={25} style={{ marginRight: matchDownSM ? 8 : 16 }} />
                  </Box>
                  {item.name}
                </Button>
              </AnimateButton>
            ))}
            <Grid container spacing={2}>
              {Object.entries(RechargeDiscount).map(([key, value]) => (
                <Grid item key={key}>
                  <Badge badgeContent={value !== 1 ? `${value * 10}折` : null} color="error">
                    <Button
                      variant="outlined"
                      onClick={() => handleSetAmount(key)}
                      sx={{
                        border: amount === Number(key) ? `1px solid ${theme.palette.primary.main}` : '1px solid transparent'
                      }}
                    >
                      ${key}
                    </Button>
                  </Badge>
                </Grid>
              ))}
            </Grid>
            <FormControl fullWidth>
              <InputLabel id="topup-amount-label">{t('topupCard.amount')}</InputLabel>
              <Select
                labelId="topup-amount-label"
                id="topup-amount-select"
                value={amount}
                label={t('topupCard.amount')}
                onChange={handleAmountChange}
              >
                {amountOptions.map((opt) => (
                  <MenuItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <Divider />
            <Grid container direction="row" justifyContent="flex-end" spacing={2}>
              <Grid item xs={6} md={9}>
                <Typography variant="h6" style={{ textAlign: 'right', fontSize: '0.875rem' }}>
                  {t('topupCard.topupAmount')}:{' '}
                </Typography>
              </Grid>
              <Grid item xs={6} md={3}>
                {'Credit ' + Number(amount)}
              </Grid>
              {discountTotal !== amount && (
                <>
                  <Grid item xs={6} md={9}>
                    <Typography variant="h6" style={{ textAlign: 'right', fontSize: '0.875rem' }}>
                      {t('topupCard.discountedPrice')}:{' '}
                    </Typography>
                  </Grid>
                  <Grid item xs={6} md={3}>
                    {'Credit ' + discountTotal}
                  </Grid>
                </>
              )}
              {selectedPayment && (selectedPayment.percent_fee > 0 || selectedPayment.fixed_fee > 0) && (
                <>
                  <Grid item xs={6} md={9}>
                    <Typography variant="h6" style={{ textAlign: 'right', fontSize: '0.875rem' }}>
                      {t('topupCard.fee')}:{' '}
                      {selectedPayment &&
                        (selectedPayment.fixed_fee > 0
                          ? '(固定)'
                          : selectedPayment.percent_fee > 0
                            ? `(${selectedPayment.percent_fee * 100}%)`
                            : '')}{' '}
                    </Typography>
                  </Grid>
                  <Grid item xs={6} md={3}>
                    {'Credit ' + calculateFee()}
                  </Grid>
                </>
              )}

              <Grid item xs={6} md={9}>
                <Typography variant="h6" style={{ textAlign: 'right', fontSize: '0.875rem' }}>
                  {t('topupCard.actualAmountToPay')}:{' '}
                </Typography>
              </Grid>
              <Grid item xs={6} md={3}>
                {calculateTotal()}{' '}
                {selectedPayment &&
                  (selectedPayment.currency === 'CNY'
                    ? `CNY (${t('topupCard.exchangeRate')}: ${siteInfo.PaymentUSDRate})`
                    : selectedPayment.currency)}
              </Grid>
            </Grid>
            <Divider />
            <Button variant="contained" onClick={handlePay} disabled={disabledPay}>
              {t('topupCard.topup')}
            </Button>
          </Stack>
          <PayDialog open={open} onClose={onClosePayDialog} amount={amount} uuid={selectedPayment.uuid} />
        </SubCard>
      )}

      <SubCard
        sx={{
          marginTop: '40px'
        }}
        title={t('topupCard.redemptionCodeTopup')}
      >
        <FormControl fullWidth variant="outlined">
          <InputLabel htmlFor="key">{t('topupCard.inputLabel')}</InputLabel>
          <OutlinedInput
            id="key"
            label={t('topupCard.inputLabel')}
            type="text"
            value={redemptionCode}
            onChange={(e) => setRedemptionCode(e.target.value)}
            name="key"
            placeholder={t('topupCard.inputPlaceholder')}
            endAdornment={
              <InputAdornment position="end">
                <Button variant="contained" onClick={topUp} disabled={isSubmitting}>
                  {isSubmitting ? t('topupCard.exchangeButton.submitting') : t('topupCard.exchangeButton.default')}
                </Button>
              </InputAdornment>
            }
            aria-describedby="helper-text-channel-quota-label"
          />
        </FormControl>

        {siteInfo.top_up_link && (
          <Stack justifyContent="center" alignItems={'center'} spacing={3} paddingTop={'20px'}>
            <Typography variant={'h4'} color={theme.palette.grey[700]}>
              {t('topupCard.noRedemptionCodeText')}
            </Typography>
            <Button variant="contained" onClick={openTopUpLink}>
              {t('topupCard.getRedemptionCode')}
            </Button>
          </Stack>
        )}
      </SubCard>
    </UserCard>
  );
};

export default TopupCard;

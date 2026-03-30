// material-ui
import { styled } from '@mui/material/styles';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router';
import { useEffect, useContext } from 'react';
import { UserContext } from 'contexts/UserContext';
import { API } from 'utils/api';
import { pathFromLoginRedirectSetting } from 'utils/loginRedirect';

// ==============================|| AUTHENTICATION 1 WRAPPER ||============================== //

const AuthStyle = styled('div')(({ theme }) => ({
  backgroundColor: theme.palette.background.default
}));

// eslint-disable-next-line
const AuthWrapper = ({ children }) => {
  const account = useSelector((state) => state.account);
  const siteInfo = useSelector((state) => state.siteInfo);
  const { isUserLoaded } = useContext(UserContext);
  const navigate = useNavigate();
  useEffect(() => {
    if (!isUserLoaded || !account.user) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await API.get('/api/status');
        const data = res.data?.data;
        if (!cancelled) {
          navigate(pathFromLoginRedirectSetting(data?.login_redirect_path ?? siteInfo?.login_redirect_path));
        }
      } catch {
        if (!cancelled) {
          navigate(pathFromLoginRedirectSetting(siteInfo?.login_redirect_path));
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [account, navigate, isUserLoaded, siteInfo?.login_redirect_path]);

  // 在用户信息加载完成前显示加载状态
  if (!isUserLoaded) {
    return <AuthStyle>加载中...</AuthStyle>;
  }

  return <AuthStyle> {children} </AuthStyle>;
};

export default AuthWrapper;

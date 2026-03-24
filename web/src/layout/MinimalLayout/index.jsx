import { useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { useTheme } from '@mui/material/styles';
import { AppBar, Box, CssBaseline, Toolbar, Container, useMediaQuery } from '@mui/material';
import { useSelector } from 'react-redux';
import Header from './Header';
import Footer from 'ui-component/Footer';

// ==============================|| MINIMAL LAYOUT ||============================== //

const MinimalLayout = () => {
  const theme = useTheme();
  const { pathname } = useLocation();
  const siteInfo = useSelector((state) => state.siteInfo);
  const matchDownSm = useMediaQuery(theme.breakpoints.down('sm'));
  const matchDownMd = useMediaQuery(theme.breakpoints.down('md'));
  const pureHomeModeOnHome = Boolean(siteInfo?.pure_home_mode) && pathname === '/';

  useEffect(() => {
    if (!pureHomeModeOnHome) {
      return;
    }
    const prevBodyOverflow = document.body.style.overflow;
    const prevHtmlOverflow = document.documentElement.style.overflow;
    document.body.style.overflow = 'hidden';
    document.documentElement.style.overflow = 'hidden';

    return () => {
      document.body.style.overflow = prevBodyOverflow;
      document.documentElement.style.overflow = prevHtmlOverflow;
    };
  }, [pureHomeModeOnHome]);

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', overflow: pureHomeModeOnHome ? 'hidden' : 'visible' }}>
      <CssBaseline />
      {pureHomeModeOnHome ? (
        <Header pureHomeModeOnHome />
      ) : (
        <AppBar
          enableColorOnDark
          position="fixed"
          color="inherit"
          elevation={0}
          sx={{
            bgcolor: theme.palette.background.default,
            boxShadow: 'none',
            borderBottom: 'none',
            zIndex: theme.zIndex.drawer + 1,
            width: '100%',
            borderRadius: 0
          }}
        >
          <Container maxWidth="xl">
            <Toolbar sx={{ px: { xs: 1.5, sm: 2, md: 3 }, minHeight: '64px', height: '64px' }}>
              <Header />
            </Toolbar>
          </Container>
        </AppBar>
      )}
      <Box
        sx={{
          flex: '1 1 auto',
          overflow: pureHomeModeOnHome ? 'hidden' : 'auto',
          marginTop: pureHomeModeOnHome ? 0 : { xs: '56px', sm: '64px' },
          backgroundColor: theme.palette.background.default,
          // padding: { xs: '16px', sm: '20px', md: '24px' },
          position: 'relative',
          minHeight: pureHomeModeOnHome ? '100vh' : `calc(100vh - ${matchDownSm ? '56px' : '64px'} - ${matchDownMd ? '80px' : '60px'})`,
          scrollbarWidth: 'thin',
          '&::-webkit-scrollbar': {
            width: '8px',
            height: '8px'
          },
          '&::-webkit-scrollbar-thumb': {
            background: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.15)',
            borderRadius: '4px'
          },
          '&::-webkit-scrollbar-track': {
            background: 'transparent'
          }
        }}
      >
        <Outlet />
      </Box>
      {!pureHomeModeOnHome && (
        <Box sx={{ flex: 'none', position: 'relative', zIndex: 1 }}>
          <Footer />
        </Box>
      )}
    </Box>
  );
};

export default MinimalLayout;

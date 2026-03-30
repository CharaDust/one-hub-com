// material-ui
import { useState } from 'react';
import { useTheme } from '@mui/material/styles';
import {
  Box,
  Button,
  Stack,
  Popper,
  IconButton,
  List,
  ListItemButton,
  Paper,
  ListItemText,
  Typography,
  Divider,
  ClickAwayListener
} from '@mui/material';
import LogoSection from 'layout/MainLayout/LogoSection';
import { Link } from 'react-router-dom';
import { useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import ThemeButton from 'ui-component/ThemeButton';
import { NoticeButton } from 'ui-component/notice';
// import I18nButton from 'ui-component/i18nButton'; // 语言切换暂不展示
import { IconMenu2 } from '@tabler/icons-react';
import Transitions from 'ui-component/extended/Transitions';
import MainCard from 'ui-component/cards/MainCard';
import { useMediaQuery } from '@mui/material';
import { useTranslation } from 'react-i18next';

// ==============================|| MINIMAL NAVBAR / HEADER ||============================== //

const Header = ({ pureHomeModeOnHome = false }) => {
  const theme = useTheme();
  const { pathname } = useLocation();
  const account = useSelector((state) => state.account);
  const [open, setOpen] = useState(null);
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const collapseToMenu = isMobile || pureHomeModeOnHome;
  const { t } = useTranslation();
  const siteInfo = useSelector((state) => state.siteInfo);
  const handleOpenMenu = (event) => {
    setOpen(open ? null : event.currentTarget);
  };

  const handleCloseMenu = () => {
    setOpen(null);
  };

  if (pureHomeModeOnHome) {
    return (
      <>
        <IconButton
          onClick={handleOpenMenu}
          sx={{
            width: 55,
            height: 55,
            minWidth: 55,
            padding: 0,
            color: theme.palette.text.primary,
            borderRadius: '12px',
            backgroundColor: theme.palette.mode === 'dark' ? '#000' : '#fff',
            boxShadow:
              theme.palette.mode === 'dark'
                ? '0 8px 24px rgba(0, 0, 0, 0.6), 0 2px 8px rgba(0, 0, 0, 0.4)'
                : '0 8px 24px rgba(0, 0, 0, 0.18), 0 2px 8px rgba(0, 0, 0, 0.1)',
            position: 'fixed',
            top: 16,
            right: 24,
            zIndex: theme.zIndex.drawer + 3,
            '&:hover': {
              backgroundColor: theme.palette.mode === 'dark' ? '#111' : '#f8f9fa'
            }
          }}
        >
          <IconMenu2 stroke={1.5} size="1.3rem" />
        </IconButton>

        <Popper
          open={!!open}
          anchorEl={open}
          transition
          disablePortal
          placement="bottom-end"
          popperOptions={{
            modifiers: [
              {
                name: 'offset',
                options: {
                  offset: [0, 14]
                }
              }
            ]
          }}
          style={{ zIndex: theme.zIndex.drawer + 2 }}
        >
          {({ TransitionProps }) => (
            <Transitions in={open} {...TransitionProps}>
              <ClickAwayListener onClickAway={handleCloseMenu}>
                <Paper
                  sx={{
                    width: { xs: '30vw', sm: '320px' },
                    borderRadius: '8px',
                    overflow: 'hidden',
                    boxShadow: theme.shadows[8],
                    textAlign: 'center'
                  }}
                >
                  <MainCard border={false} elevation={0} content={false} boxShadow>
                    <List
                      component="nav"
                      sx={{
                        width: '100%',
                        backgroundColor: theme.palette.background.paper,
                        py: 1,
                        '& .MuiListItemButton-root': {
                          py: 0.75,
                          px: 2.5,
                          '&:hover': {
                            backgroundColor: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.04)'
                          }
                        },
                        '& .Mui-selected': {
                          backgroundColor: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.05)',
                          '&:hover': {
                            backgroundColor: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.08)'
                          }
                        }
                      }}
                      onClick={handleCloseMenu}
                    >
                      <Box sx={{ display: 'flex', justifyContent: 'center', gap: 1, py: 1.5 }}>
                        <NoticeButton />
                        <ThemeButton />
                      </Box>
                      <Divider sx={{ my: 1 }} />
                      <ListItemButton component={Link} to="/" selected={pathname === '/'}>
                        <ListItemText
                          primary={
                            <Typography
                              variant="body1"
                              sx={{
                                fontWeight: pathname === '/' ? 500 : 400,
                                textAlign: 'center',
                                color: pathname === '/' ? theme.palette.primary.main : theme.palette.text.primary
                              }}
                            >
                              {t('menu.home')}
                            </Typography>
                          }
                        />
                      </ListItemButton>

                      {account.user && (
                        <ListItemButton component={Link} to="/playground" selected={pathname === '/playground'}>
                          <ListItemText
                            primary={
                              <Typography
                                variant="body1"
                                sx={{
                                  fontWeight: pathname === '/playground' ? 500 : 400,
                                  textAlign: 'center',
                                  color: pathname === '/playground' ? theme.palette.primary.main : theme.palette.text.primary
                                }}
                              >
                                {t('playground')}
                              </Typography>
                            }
                          />
                        </ListItemButton>
                      )}

                      <ListItemButton component={Link} to="/price" selected={pathname === '/price'}>
                        <ListItemText
                          primary={
                            <Typography
                              variant="body1"
                              sx={{
                                fontWeight: pathname === '/price' ? 500 : 400,
                                textAlign: 'center',
                                color: pathname === '/price' ? theme.palette.primary.main : theme.palette.text.primary
                              }}
                            >
                              {t('price')}
                            </Typography>
                          }
                        />
                      </ListItemButton>

                      <ListItemButton component={Link} to="/about" selected={pathname === '/about'}>
                        <ListItemText
                          primary={
                            <Typography
                              variant="body1"
                              sx={{
                                fontWeight: pathname === '/about' ? 500 : 400,
                                textAlign: 'center',
                                color: pathname === '/about' ? theme.palette.primary.main : theme.palette.text.primary
                              }}
                            >
                              {t('menu.about')}
                            </Typography>
                          }
                        />
                      </ListItemButton>
                      {siteInfo.UptimeEnabled && (
                        <ListItemButton component="a" href={siteInfo.UptimeDomain} target="_blank" rel="noopener noreferrer">
                          <ListItemText
                            primary={
                              <Typography
                                variant="body1"
                                sx={{
                                  fontWeight: pathname === '/status' ? 500 : 400,
                                  textAlign: 'center',
                                  color: pathname === '/status' ? theme.palette.primary.main : theme.palette.text.primary
                                }}
                              >
                                {t('menu.status')}
                              </Typography>
                            }
                          />
                        </ListItemButton>
                      )}
                      <Divider sx={{ my: 1 }} />
                      {account.user ? (
                        <ListItemButton
                          component={Link}
                          to="/panel"
                          sx={{
                            fontWeight: pathname === '/panel' ? 500 : 400,
                            color: pathname === '/panel' ? theme.palette.primary.main : theme.palette.text.primary
                          }}
                        >
                          <ListItemText
                            primary={
                              <Typography
                                color="primary"
                                variant="body1"
                                sx={{
                                  fontWeight: 600,
                                  textAlign: 'center',
                                  transition: 'color 0.2s ease'
                                }}
                              >
                                {t('menu.console')}
                              </Typography>
                            }
                          />
                        </ListItemButton>
                      ) : (
                        <ListItemButton
                          component={Link}
                          to="/login"
                          sx={{
                            fontWeight: pathname === '/login' ? 500 : 400,
                            color: pathname === '/login' ? theme.palette.primary.main : theme.palette.text.primary
                          }}
                        >
                          <ListItemText
                            primary={
                              <Typography
                                color="primary"
                                variant="body1"
                                sx={{
                                  fontWeight: 600,
                                  textAlign: 'center',
                                  transition: 'color 0.2s ease'
                                }}
                              >
                                {t('menu.login')}
                              </Typography>
                            }
                          />
                        </ListItemButton>
                      )}
                    </List>
                  </MainCard>
                </Paper>
              </ClickAwayListener>
            </Transitions>
          )}
        </Popper>
      </>
    );
  }

  return (
    <>
      <Box
        sx={{
          width: 228,
          display: 'flex',
          alignItems: 'center',
          visibility: pureHomeModeOnHome ? 'hidden' : 'visible',
          [theme.breakpoints.down('md')]: {
            width: 'auto'
          }
        }}
      >
        <Box component="span" sx={{ display: 'block' }}>
          <LogoSection />
        </Box>
      </Box>

      <Box sx={{ flexGrow: 1 }} />
      <Stack spacing={{ xs: 0.5, sm: 1, md: 2 }} direction="row" justifyContent="center" alignItems="center">
        {collapseToMenu ? (
          <>
            <IconButton
              onClick={handleOpenMenu}
              sx={{
                width: 60,
                height: 60,
                minWidth: 60,
                padding: 0,
                color: theme.palette.text.primary,
                borderRadius: '12px',
                backgroundColor: theme.palette.mode === 'dark' ? '#000' : '#fff',
                boxShadow:
                  theme.palette.mode === 'dark'
                    ? '0 6px 18px rgba(0, 0, 0, 0.55), 0 2px 6px rgba(0, 0, 0, 0.35)'
                    : '0 6px 18px rgba(0, 0, 0, 0.16), 0 2px 6px rgba(0, 0, 0, 0.1)',
                ...(pureHomeModeOnHome
                  ? {
                      position: 'fixed',
                      top: 16,
                      right: 24,
                      zIndex: theme.zIndex.drawer + 3
                    }
                  : {}),
                '&:hover': {
                  backgroundColor: theme.palette.mode === 'dark' ? '#111' : '#f8f9fa'
                }
              }}
            >
              <IconMenu2 stroke={1.5} size="1.3rem" />
            </IconButton>
          </>
        ) : (
          <>
            <Button
              component={Link}
              variant="text"
              to="/"
              color={pathname === '/' ? 'primary' : 'inherit'}
              sx={{
                fontSize: '0.875rem',
                fontWeight: 500,
                textTransform: 'none'
              }}
            >
              {t('menu.home')}
            </Button>
            {account.user && (
              <Button
                component={Link}
                variant="text"
                to="/playground"
                color={pathname === '/playground' ? 'primary' : 'inherit'}
                sx={{
                  fontSize: '0.875rem',
                  fontWeight: 500,
                  textTransform: 'none'
                }}
              >
                {t('playground')}
              </Button>
            )}
            <Button
              component={Link}
              variant="text"
              to="/price"
              color={pathname === '/price' ? 'primary' : 'inherit'}
              sx={{
                fontSize: '0.875rem',
                fontWeight: 500,
                textTransform: 'none'
              }}
            >
              {t('price')}
            </Button>
            <Button
              component={Link}
              variant="text"
              to="/about"
              color={pathname === '/about' ? 'primary' : 'inherit'}
              sx={{
                fontSize: '0.875rem',
                fontWeight: 500,
                textTransform: 'none'
              }}
            >
              {t('menu.about')}
            </Button>
            {siteInfo.UptimeEnabled && (
              <Button
                component="a"
                variant="text"
                href={siteInfo.UptimeDomain}
                target="_blank"
                rel="noopener noreferrer"
                color={pathname === '/status' ? 'primary' : 'inherit'}
                sx={{
                  fontSize: '0.875rem',
                  fontWeight: 500,
                  textTransform: 'none'
                }}
              >
                {t('menu.status')}
              </Button>
            )}

            <NoticeButton sx={{ color: theme.palette.text.primary, ml: 1 }} />
            <ThemeButton sx={{ color: theme.palette.text.primary, ml: 0.5 }} />
            {/* <I18nButton sx={{ color: theme.palette.text.primary, ml: 0.5 }} /> */}
            {account.user ? (
              <Button
                component={Link}
                variant="contained"
                to="/panel"
                color="primary"
                sx={{
                  ml: 2,
                  px: 2,
                  height: '40px',
                  fontSize: '0.875rem',
                  fontWeight: 500,
                  textTransform: 'none'
                }}
              >
                {t('menu.console')}
              </Button>
            ) : (
              <Button
                component={Link}
                variant="contained"
                to="/login"
                color="primary"
                sx={{
                  ml: 2,
                  px: 2.5,
                  height: '40px',
                  fontSize: '0.875rem',
                  fontWeight: 500,
                  textTransform: 'none'
                }}
              >
                {t('menu.login')}
              </Button>
            )}
          </>
        )}
      </Stack>

      <Popper
        open={!!open}
        anchorEl={open}
        transition
        disablePortal
        placement="bottom-end"
        popperOptions={{
          modifiers: [
            {
              name: 'offset',
              options: {
                offset: [0, 14]
              }
            }
          ]
        }}
        style={{ zIndex: theme.zIndex.drawer + 2 }}
      >
        {({ TransitionProps }) => (
          <Transitions in={open} {...TransitionProps}>
            <ClickAwayListener onClickAway={handleCloseMenu}>
              <Paper
                sx={{
                  width: { xs: '30vw', sm: '320px' },
                  borderRadius: '8px',
                  overflow: 'hidden',
                  boxShadow: theme.shadows[8],
                  textAlign: 'center'
                }}
              >
                <MainCard border={false} elevation={0} content={false} boxShadow>
                  <List
                    component="nav"
                    sx={{
                      width: '100%',
                      backgroundColor: theme.palette.background.paper,
                      py: 1,
                      '& .MuiListItemButton-root': {
                        py: 0.75,
                        px: 2.5,
                        '&:hover': {
                          backgroundColor: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.04)'
                        }
                      },
                      '& .Mui-selected': {
                        backgroundColor: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.05)',
                        '&:hover': {
                          backgroundColor: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.08)'
                        }
                      }
                    }}
                    onClick={handleCloseMenu}
                  >
                    <Box sx={{ display: 'flex', justifyContent: 'center', gap: 1, py: 1.5 }}>
                      <NoticeButton />
                      <ThemeButton />
                    </Box>
                    <Divider sx={{ my: 1 }} />
                    <ListItemButton component={Link} to="/" selected={pathname === '/'}>
                      <ListItemText
                        primary={
                          <Typography
                            variant="body1"
                            sx={{
                              fontWeight: pathname === '/' ? 500 : 400,
                              textAlign: 'center',
                              color: pathname === '/' ? theme.palette.primary.main : theme.palette.text.primary
                            }}
                          >
                            {t('menu.home')}
                          </Typography>
                        }
                      />
                    </ListItemButton>

                    {account.user && (
                      <ListItemButton component={Link} to="/playground" selected={pathname === '/playground'}>
                        <ListItemText
                          primary={
                            <Typography
                              variant="body1"
                              sx={{
                                fontWeight: pathname === '/playground' ? 500 : 400,
                                textAlign: 'center',
                                color: pathname === '/playground' ? theme.palette.primary.main : theme.palette.text.primary
                              }}
                            >
                              {t('playground')}
                            </Typography>
                          }
                        />
                      </ListItemButton>
                    )}

                    <ListItemButton component={Link} to="/price" selected={pathname === '/price'}>
                      <ListItemText
                        primary={
                          <Typography
                            variant="body1"
                            sx={{
                              fontWeight: pathname === '/price' ? 500 : 400,
                              textAlign: 'center',
                              color: pathname === '/price' ? theme.palette.primary.main : theme.palette.text.primary
                            }}
                          >
                            {t('price')}
                          </Typography>
                        }
                      />
                    </ListItemButton>

                    <ListItemButton component={Link} to="/about" selected={pathname === '/about'}>
                      <ListItemText
                        primary={
                          <Typography
                            variant="body1"
                            sx={{
                              fontWeight: pathname === '/about' ? 500 : 400,
                              textAlign: 'center',
                              color: pathname === '/about' ? theme.palette.primary.main : theme.palette.text.primary
                            }}
                          >
                            {t('menu.about')}
                          </Typography>
                        }
                      />
                    </ListItemButton>
                    {siteInfo.UptimeEnabled && (
                      <ListItemButton
                        component="a"
                        href={siteInfo.UptimeDomain}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <ListItemText
                          primary={
                            <Typography
                              variant="body1"
                              sx={{
                                fontWeight: pathname === '/status' ? 500 : 400,
                                textAlign: 'center',
                                color: pathname === '/status' ? theme.palette.primary.main : theme.palette.text.primary
                              }}
                            >
                              {t('menu.status')}
                            </Typography>
                          }
                        />
                      </ListItemButton>
                    )}
                    <Divider sx={{ my: 1 }} />
                    {account.user ? (
                      <ListItemButton
                        component={Link}
                        to="/panel"
                        sx={{
                          fontWeight: pathname === '/panel' ? 500 : 400,
                          color: pathname === '/panel' ? theme.palette.primary.main : theme.palette.text.primary
                        }}
                      >
                        <ListItemText
                          primary={
                            <Typography
                              color="primary"
                              variant="body1"
                              sx={{
                                fontWeight: 600,
                                textAlign: 'center',
                                transition: 'color 0.2s ease'
                              }}
                            >
                              {t('menu.console')}
                            </Typography>
                          }
                        />
                      </ListItemButton>
                    ) : (
                      <ListItemButton
                        component={Link}
                        to="/login"
                        sx={{
                          fontWeight: pathname === '/login' ? 500 : 400,
                          color: pathname === '/login' ? theme.palette.primary.main : theme.palette.text.primary
                        }}
                      >
                        <ListItemText
                          primary={
                            <Typography
                              color="primary"
                              variant="body1"
                              sx={{
                                fontWeight: 600,
                                textAlign: 'center',
                                transition: 'color 0.2s ease'
                              }}
                            >
                              {t('menu.login')}
                            </Typography>
                          }
                        />
                      </ListItemButton>
                    )}
                  </List>
                </MainCard>
              </Paper>
            </ClickAwayListener>
          </Transitions>
        )}
      </Popper>
    </>
  );
};

export default Header;

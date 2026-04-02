import React, { useEffect, useState } from 'react';
import { showError } from 'utils/common';
import { API } from 'utils/api';
import BaseIndex from './baseIndex';
import { Box } from '@mui/material';
import { useTranslation } from 'react-i18next';
import ContentViewer from 'ui-component/ContentViewer';
import { useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';

const Home = () => {
  const { t } = useTranslation();
  const { pathname } = useLocation();
  const siteInfo = useSelector((state) => state.siteInfo);
  const [homePageContentLoaded, setHomePageContentLoaded] = useState(false);
  const [homePageContent, setHomePageContent] = useState('');
  const pureHomeModeOnHome = Boolean(siteInfo?.pure_home_mode) && pathname === '/';

  const displayHomePageContent = async () => {
    setHomePageContent(localStorage.getItem('home_page_content') || '');
    try {
      const res = await API.get('/api/home_page_content');
      const { success, message, data } = res.data;
      if (success) {
        setHomePageContent(data);
        localStorage.setItem('home_page_content', data);
      } else {
        showError(message);
        setHomePageContent(t('home.loadingErr'));
      }
      setHomePageContentLoaded(true);
    } catch (error) {
      return;
    }
  };

  useEffect(() => {
    displayHomePageContent().then();
  }, []);

  return (
    <>
      {homePageContentLoaded && homePageContent === '' ? (
        <BaseIndex pureHomeModeOnHome={pureHomeModeOnHome} />
      ) : (
        <Box>
          <ContentViewer
            content={homePageContent}
            loading={!homePageContentLoaded}
            errorMessage={homePageContent === t('home.loadingErr') ? t('home.loadingErr') : ''}
            containerStyle={{
              minHeight: pureHomeModeOnHome ? '100vh' : 'calc(100vh - 136px)',
              height: pureHomeModeOnHome ? '100vh' : 'auto'
            }}
            iframeHeight={pureHomeModeOnHome ? '100%' : '100vh'}
            contentStyle={{ fontSize: 'larger' }}
          />
        </Box>
      )}
    </>
  );
};

export default Home;

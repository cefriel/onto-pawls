import React from 'react';

import pawlsLogo from './pawlsLogo.png';
import styled from 'styled-components';

export const Header = () => {
    return (
        <>
            <Logo src={pawlsLogo} />
        </>
    );
};

const Logo = styled.img`
    margin: 20px 4px 10px 0px;
    padding: 4px;
    max-width: 100%;
`;

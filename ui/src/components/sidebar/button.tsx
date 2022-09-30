import React from 'react';
import { Button as InternalButton, Spinner } from 'react-bootstrap';

export enum ButtonState {
    Primary = 'Primary',
    Loading = 'Loading',
}

interface ButtonProps {
    readonly buttonState: ButtonState;
    readonly onClick: () => void;
    readonly label: string;
}

export const Button: React.FC<ButtonProps> = ({ buttonState, onClick, label }) => {
    const isLoading = buttonState === ButtonState.Loading;
    return (
        <div className="d-flex">
            <InternalButton onClick={onClick} variant="primary" className="btn m-1">
                {isLoading && (
                    <Spinner
                        as="span"
                        animation="border"
                        size="sm"
                        role="status"
                        aria-hidden="true"
                    />
                )}
                {!isLoading && label}
            </InternalButton>
        </div>
    );
};

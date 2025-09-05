import React from 'react';
import { Avatar, Box, Button, styled } from '@mui/material';

interface PhotoUploaderProps {
  photo: string;
  photoFilename: string;
  disabled: boolean;
  onChange: (url: string, filename: string) => void;
}

const VisuallyHiddenInput = styled('input')({
  clip: 'rect(0 0 0 0)',
  clipPath: 'inset(50%)',
  height: 1,
  overflow: 'hidden',
  position: 'absolute',
  bottom: 0,
  left: 0,
  whiteSpace: 'nowrap',
  width: 1,
});

export const PhotoUploader: React.FC<PhotoUploaderProps> = ({ photo, disabled, onChange }) => {
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const url = URL.createObjectURL(file);
      onChange(url, file.name);
      // It's a good practice to revoke the object URL when the component unmounts to free up memory
      // This can be done in a useEffect cleanup function in the parent component.
    }
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
      <Avatar
        src={photo}
        alt="Photo"
        sx={{ width: 120, height: 120, border: '1px solid lightgray' }}
      />
      <Button
        component="label"
        variant="contained"
        disabled={disabled}
      >
        Cargar Foto
        <VisuallyHiddenInput type="file" accept="image/*" onChange={handleFileChange} />
      </Button>
    </Box>
  );
};

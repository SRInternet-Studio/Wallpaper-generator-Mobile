import { Button, Container, CssBaseline, Typography } from '@mui/material';

function App() {
  return (
    <>
      <CssBaseline />
      <Container>
        <Typography variant="h1" component="h1" gutterBottom>
          Welcome to Tauri + MUI
        </Typography>
        <Typography variant="body1" gutterBottom>
          This is a sample application demonstrating the integration of Tauri with Material-UI.
        </Typography>
        <Button variant="contained" color="primary">
          Hello World
        </Button>
      </Container>
    </>
  );
}

export default App;

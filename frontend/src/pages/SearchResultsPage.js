import React from 'react';
import { Link } from 'react-router-dom';
import { Box, Grid, Card, CardContent, Typography, List, ListItem, ListItemButton, ListItemText } from '@mui/material';

function SearchResultsPage({ filteredProducts, filteredCustomers }) {
  return (
    <Box>
      <Typography variant="h2" gutterBottom>🔍 Search Results</Typography>
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h3" gutterBottom>Matching Customers</Typography>
              {filteredCustomers.length > 0 ? (
                <List>
                  {filteredCustomers.map(customer => (
                    <ListItem key={customer.id} disablePadding>
                        <ListItemButton component={Link} to={`/customer/${customer.id}`}>
                            <ListItemText primary={customer.name} />
                        </ListItemButton>
                    </ListItem>
                  ))}
                </List>
              ) : (
                <Typography>No customers found.</Typography>
              )}
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h3" gutterBottom>Matching Products</Typography>
              {filteredProducts.length > 0 ? (
                <List>
                  {filteredProducts.map(product => (
                    <ListItem key={product.id}>
                        <ListItemText primary={product.name} />
                    </ListItem>
                  ))}
                </List>
              ) : (
                <Typography>No products found.</Typography>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}

export default SearchResultsPage;
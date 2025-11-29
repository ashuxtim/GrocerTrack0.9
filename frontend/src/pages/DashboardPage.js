import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
    Box, Grid, Card, CardContent, Typography, List, ListItem, 
    ListItemText, CircularProgress, Chip 
} from '@mui/material';

import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import PeopleOutlineIcon from '@mui/icons-material/PeopleOutline';
import ShoppingCartOutlinedIcon from '@mui/icons-material/ShoppingCartOutlined';
import Inventory2OutlinedIcon from '@mui/icons-material/Inventory2Outlined';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';

import { LineChart, PieChart } from '@mui/x-charts';

const mockSalesData = [
    { month: "Jan", sales: 2000 },
    { month: "Feb", sales: 2400 },
    { month: "Mar", sales: 2600 },
    { month: "Apr", sales: 3000 },
    { month: "May", sales: 3200 },
    { month: "Jun", sales: 3500 },
];

function DashboardPage() {
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        axios.get("http://localhost:8000/api/dashboard/")
            .then(res => {
                setStats(res.data);
                setLoading(false);
            })
            .catch(err => {
                console.log(err);
                setError("Unable to load dashboard data");
                setLoading(false);
            });
    }, []);

    if (loading) {
        return (
            <Box sx={{ height: "80vh", display: "flex", justifyContent: "center", alignItems: "center" }}>
                <CircularProgress />
            </Box>
        );
    }

    if (error || !stats) {
        return (
            <Box sx={{ p: 3, textAlign: "center", color: "error.main" }}>
                <Typography variant="h6">{error}</Typography>
            </Box>
        );
    }

    return (
        <Box sx={{ width: "100%", pr: 4, pl: 3 }}>
            <Typography variant="h3" sx={{ mb: 3, fontWeight: 700 }}>
                📊 Dashboard Overview
            </Typography>

            <Grid container spacing={3}>

                {/* KPI CARDS */}
                <Grid item xs={12} sm={6} md={3}>
                    <Card sx={{ p: 2 }}>
                        <Box sx={{ display: "flex", alignItems: "center" }}>
                            <AttachMoneyIcon sx={{ fontSize: 40, mr: 2, color: "#6A1B9A" }} />
                            <Box>
                                <Typography color="text.secondary">Total Outstanding Credit</Typography>
                                <Typography variant="h5">₹{stats.total_outstanding_credit.toFixed(2)}</Typography>
                            </Box>
                        </Box>
                    </Card>
                </Grid>

                <Grid item xs={12} sm={6} md={3}>
                    <Card sx={{ p: 2 }}>
                        <Box sx={{ display: "flex", alignItems: "center" }}>
                            <Inventory2OutlinedIcon sx={{ fontSize: 40, mr: 2, color: "#0288D1" }} />
                            <Box>
                                <Typography color="text.secondary">Total Variants</Typography>
                                <Typography variant="h5">{stats.total_product_variants}</Typography>
                            </Box>
                        </Box>
                    </Card>
                </Grid>

                <Grid item xs={12} sm={6} md={3}>
                    <Card sx={{ p: 2 }}>
                        <Box sx={{ display: "flex", alignItems: "center" }}>
                            <PeopleOutlineIcon sx={{ fontSize: 40, mr: 2, color: "#009688" }} />
                            <Box>
                                <Typography color="text.secondary">Total Customers</Typography>
                                <Typography variant="h5">{stats.total_customers}</Typography>
                            </Box>
                        </Box>
                    </Card>
                </Grid>

                <Grid item xs={12} sm={6} md={3}>
                    <Card sx={{ p: 2 }}>
                        <Box sx={{ display: "flex", alignItems: "center" }}>
                            <ShoppingCartOutlinedIcon sx={{ fontSize: 40, mr: 2, color: "#8E24AA" }} />
                            <Box>
                                <Typography color="text.secondary">This Month Sales</Typography>
                                <Typography variant="h5">₹{mockSalesData.at(-1).sales}</Typography>
                            </Box>
                        </Box>
                    </Card>
                </Grid>

                {/* SALES TREND + PIE CHART */}
                <Grid item xs={12} md={8}>
                    <Card sx={{ p: 2 }}>
                        <Typography variant="h4" sx={{ mb: 2 }}>📈 Sales Trend</Typography>

                        <LineChart
                            xAxis={[{ data: mockSalesData.map(x => x.month) }]}
                            series={[{ data: mockSalesData.map(x => x.sales), color: "#6A1B9A" }]}
                            width={600}
                            height={300}
                        />
                    </Card>
                </Grid>

                <Grid item xs={12} md={4}>
                    <Card sx={{ p: 2 }}>
                        <Typography variant="h4" sx={{ mb: 2 }}>💰 Credit Breakdown</Typography>

                        <PieChart
                            series={[
                                {
                                    data: [
                                        { id: 0, value: stats.total_outstanding_credit, label: "Credit Due" },
                                        { id: 1, value: 100000, label: "Paid (Mock)" }
                                    ],
                                },
                            ]}
                            width={350}
                            height={300}
                        />
                    </Card>
                </Grid>

                {/* LOW STOCK ITEMS */}
                <Grid item xs={12} md={6}>
                    <Card sx={{ p: 2, height: "100%" }}>
                        <Typography variant="h4" sx={{ mb: 2 }}>⚠️ Low Stock Items</Typography>

                        {stats.low_stock_items.length > 0 ? (
                            <List dense>
                                {stats.low_stock_items.map(item => (
                                    <ListItem key={item.id} divider>
                                        <ListItemText 
                                            primary={`${item.product_name} (${item.name})`}
                                            secondary={`Stock: ${item.current_stock}`}
                                        />
                                        <Chip label="Low" color="warning" />
                                    </ListItem>
                                ))}
                            </List>
                        ) : (
                            <Typography color="text.secondary">No low stock items.</Typography>
                        )}
                    </Card>
                </Grid>

                {/* TOP CUSTOMERS */}
                <Grid item xs={12} md={6}>
                    <Card sx={{ p: 2, height: "100%" }}>
                        <Typography variant="h4" sx={{ mb: 2 }}>👑 Top Customers by Credit</Typography>

                        {stats.top_customers_by_credit.length > 0 ? (
                            <List dense>
                                {stats.top_customers_by_credit.map((c, idx) => (
                                    <ListItem key={idx} divider>
                                        <ListItemText primary={c.name} />
                                        <Chip label={`₹${c.balance.toFixed(2)}`} color="error" />
                                    </ListItem>
                                ))}
                            </List>
                        ) : (
                            <Typography color="text.secondary">No outstanding credits.</Typography>
                        )}
                    </Card>
                </Grid>
            </Grid>
        </Box>
    );
}

export default DashboardPage;

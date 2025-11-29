import React, { useState, useEffect, useCallback, useRef } from "react";
import axios from "axios";
import { toast } from "react-toastify";

import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  IconButton,
  CircularProgress,
  InputAdornment,
} from "@mui/material";

import PeopleIcon from "@mui/icons-material/People";
import DeleteIcon from "@mui/icons-material/Delete";
import RefreshIcon from "@mui/icons-material/Refresh";
import SearchIcon from "@mui/icons-material/Search";
import ArrowDropDownIcon from "@mui/icons-material/ArrowDropDown";

import { Link } from "react-router-dom";

const API_BASE = "http://localhost:8000/api/";

export default function CustomerPage() {
  // Add Customer fields
  const [name, setName] = useState("");
  const [mobile, setMobile] = useState("");
  const [address, setAddress] = useState("");

  // Payment fields
  const [paymentCustomerId, setPaymentCustomerId] = useState("");
  const [paymentAmount, setPaymentAmount] = useState("");
  const [paymentCustomerBalance, setPaymentCustomerBalance] = useState(null);
  const [loadingBalance, setLoadingBalance] = useState(false);

  // Customer list & pagination
  const [customers, setCustomers] = useState([]);
  const [count, setCount] = useState(0);
  const [page, setPage] = useState(1);
  const [pageCount, setPageCount] = useState(1);

  const [loading, setLoading] = useState(false);

  // Search + Sorting
  const [searchTerm, setSearchTerm] = useState("");
  const searchTimeoutRef = useRef(null);
  const [ordering, setOrdering] = useState("name");

  // ---------------------------
  // Fetch Customers (Paginated)
  // ---------------------------
  const fetchCustomers = useCallback(
    async ({ pageToFetch = 1, q = "", ord = ordering, append = false }) => {
      setLoading(true);

      try {
        const params = { page: pageToFetch };
        if (q) params.search = q;
        if (ord) params.ordering = ord;

        const res = await axios.get(`${API_BASE}customers/`, { params });

        const results = res.data.results || [];
        const total = res.data.count || 0;
        const size = results.length || 10;

        setCustomers((prev) => (append ? [...prev, ...results] : results));
        setCount(total);
        setPage(pageToFetch);
        setPageCount(Math.ceil(total / size));
      } catch (err) {
        toast.error("Failed to load customers.");
      } finally {
        setLoading(false);
      }
    },
    [ordering]
  );

  // Initial load
  useEffect(() => {
    fetchCustomers({ pageToFetch: 1 });
  }, []);

  // Debounced Search
  useEffect(() => {
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);

    searchTimeoutRef.current = setTimeout(() => {
      fetchCustomers({ pageToFetch: 1, q: searchTerm.trim(), ord: ordering });
    }, 350);

    return () => clearTimeout(searchTimeoutRef.current);
  }, [searchTerm, ordering]);

  // Load More
  const handleLoadMore = () => {
    if (page < pageCount) {
      fetchCustomers({
        pageToFetch: page + 1,
        q: searchTerm.trim(),
        ord: ordering,
        append: true,
      });
    }
  };

  // ---------------------------
  // Add Customer
  // ---------------------------
  const handleAddCustomer = async (e) => {
    e.preventDefault();

    if (!name.trim()) return toast.warn("Customer name is required");

    try {
      const payload = {
        name: name.trim(),
        mobile: mobile.trim() || null,
        address: address.trim() || null,
      };

      const res = await axios.post(`${API_BASE}customers/`, payload);
      toast.success("Customer added");

      setCustomers((prev) => [res.data, ...prev]);

      setName("");
      setMobile("");
      setAddress("");
    } catch (err) {
      toast.error("Failed to add customer");
    }
  };

  // ---------------------------
  // Auto load Balance
  // ---------------------------
  useEffect(() => {
    if (!paymentCustomerId) {
      setPaymentCustomerBalance(null);
      return;
    }

    let active = true;

    const loadBalance = async () => {
      setLoadingBalance(true);
      try {
        const res = await axios.get(
          `${API_BASE}customer-detail/${paymentCustomerId}/`
        );
        if (active) setPaymentCustomerBalance(res.data.balance || 0);
      } catch {
        setPaymentCustomerBalance(null);
      } finally {
        setLoadingBalance(false);
      }
    };

    loadBalance();
    return () => {
      active = false;
    };
  }, [paymentCustomerId]);

  // ---------------------------
  // Record Payment
  // ---------------------------
  const handleRecordPayment = async (e) => {
    e.preventDefault();

    if (!paymentCustomerId) return toast.warn("Select a customer");
    if (!paymentAmount || Number(paymentAmount) <= 0)
      return toast.warn("Enter valid amount");

    try {
      await axios.post(`${API_BASE}payments/`, {
        customer: paymentCustomerId,
        amount: Number(paymentAmount),
      });

      toast.success("Payment recorded");

      setPaymentAmount("");
      setPaymentCustomerId("");
      setPaymentCustomerBalance(null);

      fetchCustomers({ pageToFetch: 1, q: "", ord: ordering });
    } catch {
      toast.error("Failed to record payment");
    }
  };

  // ---------------------------
  // Delete Customer
  // ---------------------------
  const handleDelete = async (id) => {
    if (!window.confirm("Delete customer and all records?")) return;
    try {
      await axios.delete(`${API_BASE}customers/${id}/`);
      setCustomers((prev) => prev.filter((c) => c.id !== id));
      toast.success("Customer deleted");
    } catch {
      toast.error("Unable to delete customer");
    }
  };

  // ---------------------------
  // Reset list
  // ---------------------------
  const handleRefresh = () => {
    setSearchTerm("");
    setOrdering("name");
    fetchCustomers({ pageToFetch: 1, q: "", ord: "name" });
  };

  // ---------------------------
  // Layout
  // ---------------------------
  return (
    <Box sx={{ width: "100%", pr: 3 }}>

      {/* HEADER LIKE ADD SALE */}
      <Box sx={{ display: "flex", alignItems: "center", mb: 3 }}>
        <PeopleIcon sx={{ fontSize: 40, color: "primary.main", mr: 1 }} />
        <Typography variant="h4" sx={{ fontWeight: 700 }}>
          Customers
        </Typography>
      </Box>

      {/* FORMS ROW */}
      <Grid container spacing={3}>

        {/* Add Customer */}
        <Grid item xs={12} md={6} lg={5}>
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2 }}>
                Add New Customer
              </Typography>

              <Box component="form" onSubmit={handleAddCustomer} sx={{ display: "flex", flexDirection: "column", gap: 2 }}>

                <TextField
                  label="Full Name *"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />

                <TextField
                  label="Mobile"
                  value={mobile}
                  onChange={(e) => setMobile(e.target.value)}
                />

                <TextField
                  label="Address"
                  multiline
                  rows={2}
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                />

                <Button variant="contained" type="submit">
                  Add Customer
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Payment Card */}
        <Grid item xs={12} md={6} lg={5}>
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2 }}>
                Record Payment
              </Typography>

              <Box component="form" onSubmit={handleRecordPayment} sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                
                <FormControl fullWidth>
                  <InputLabel>Customer</InputLabel>
                  <Select
                    value={paymentCustomerId}
                    label="Customer"
                    onChange={(e) => setPaymentCustomerId(e.target.value)}
                  >
                    <MenuItem value="">-- Select Customer --</MenuItem>
                    {customers.map((c) => (
                      <MenuItem key={c.id} value={c.id}>
                        {c.name} {c.mobile ? `— ${c.mobile}` : ""}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>

                {/* Balance Row */}
                <Box sx={{ display: "flex", gap: 1, alignItems: "center" }}>
                  <Typography>Balance:</Typography>

                  {loadingBalance ? (
                    <CircularProgress size={18} />
                  ) : (
                    <Typography
                      sx={{
                        fontWeight: 600,
                        color:
                          (paymentCustomerBalance || 0) > 0
                            ? "error.main"
                            : "success.main",
                      }}
                    >
                      ₹{Number(paymentCustomerBalance || 0).toFixed(2)}
                    </Typography>
                  )}
                </Box>

                <TextField
                  label="Amount"
                  type="number"
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(e.target.value)}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">₹</InputAdornment>
                    ),
                  }}
                />

                <Button variant="contained" type="submit">
                  Record Payment
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* --------------------------- */}
      {/* CUSTOMER LIST */}
      {/* --------------------------- */}
      <Box sx={{ mt: 4 }}>
        <Card>
          <CardContent>
            
            {/* Search + Sorting Row */}
            <Box sx={{ display: "flex", gap: 2, alignItems: "center", mb: 2 }}>
              <Box sx={{ display: "flex", flex: 1, alignItems: "center" }}>
                <SearchIcon sx={{ mr: 1, color: "#777" }} />
                <TextField
                  placeholder="Search name, mobile or address..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  variant="standard"
                  fullWidth
                />
              </Box>

              <FormControl variant="standard" sx={{ minWidth: 180 }}>
                <InputLabel>Sort By</InputLabel>
                <Select
                  value={ordering}
                  onChange={(e) => setOrdering(e.target.value)}
                  IconComponent={ArrowDropDownIcon}
                >
                  <MenuItem value="name">Name (A → Z)</MenuItem>
                  <MenuItem value="-name">Name (Z → A)</MenuItem>
                  <MenuItem value="-balance">Balance (High → Low)</MenuItem>
                  <MenuItem value="balance">Balance (Low → High)</MenuItem>
                  <MenuItem value="-id">Newest</MenuItem>
                  <MenuItem value="id">Oldest</MenuItem>
                </Select>
              </FormControl>

              <Button startIcon={<RefreshIcon />} onClick={handleRefresh}>
                Refresh
              </Button>
            </Box>

            {/* TABLE */}
            <Box sx={{ maxHeight: 450, overflowY: "auto" }}>
              <Table stickyHeader size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Name</TableCell>
                    <TableCell>Mobile</TableCell>
                    <TableCell>Address</TableCell>
                    <TableCell align="right">Balance</TableCell>
                    <TableCell align="center">Actions</TableCell>
                  </TableRow>
                </TableHead>

                <TableBody>
                  {loading && customers.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} align="center">
                        <CircularProgress />
                      </TableCell>
                    </TableRow>
                  ) : customers.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} align="center">
                        No customers found.
                      </TableCell>
                    </TableRow>
                  ) : (
                    customers.map((c) => (
                      <TableRow key={c.id} hover>
                        <TableCell>
                          <Link
                            to={`/customer/${c.id}`}
                            style={{ textDecoration: "none", color: "inherit" }}
                          >
                            <Typography sx={{ fontWeight: 600 }}>
                              {c.name}
                            </Typography>
                          </Link>
                        </TableCell>

                        <TableCell>{c.mobile || "—"}</TableCell>

                        <TableCell
                          sx={{
                            maxWidth: 250,
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {c.address || "—"}
                        </TableCell>

                        <TableCell align="right">
                          <Typography
                            sx={{
                              fontWeight: 600,
                              color:
                                Number(c.balance) > 0
                                  ? "error.main"
                                  : "success.main",
                            }}
                          >
                            ₹{Number(c.balance || 0).toFixed(2)}
                          </Typography>
                        </TableCell>

                        <TableCell align="center">
                          <IconButton color="error" onClick={() => handleDelete(c.id)}>
                            <DeleteIcon />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </Box>

            {/* Load More */}
            <Box sx={{ mt: 2, display: "flex", justifyContent: "space-between" }}>
              <Typography variant="body2">
                Showing {customers.length} of {count} customers
              </Typography>

              {page < pageCount && (
                <Button variant="outlined" onClick={handleLoadMore}>
                  Load More
                </Button>
              )}
            </Box>
          </CardContent>
        </Card>
      </Box>
    </Box>
  );
}

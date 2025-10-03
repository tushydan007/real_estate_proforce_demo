"use client";

import { useSelector } from "react-redux";
import type { RootState } from "../../redux/store";
import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { motion } from "framer-motion";
import toast, { Toaster } from "react-hot-toast";
import axios, { AxiosError } from "axios";
import { useEffect, useState, useCallback, useMemo } from "react";
import { PayPalScriptProvider, PayPalButtons } from "@paypal/react-paypal-js";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Check, ChevronsUpDown } from "lucide-react";
import type {
  OnApproveData,
  OnApproveActions,
  CreateOrderActions,
  CreateOrderData,
} from "@paypal/paypal-js";

// ========== Type Definitions ==========
interface LocationState {
  durationType?: "days" | "months" | "years";
  durationValue?: number;
  totalCost?: number;
}

interface OrderPayload {
  items: Array<{
    id: string;
    name: string;
    area: number;
    type: string;
    monitoring_enabled: boolean;
    is_active: boolean;
  }>;
  email: string;
  country: string;
  duration: {
    type: string;
    value: number;
  };
  total_cost: number;
}

interface BackendOrderResponse {
  order_id: string;
  status?: string;
  created_at?: string;
}

interface PayPalOrderResponse {
  id: string; // PayPal order ID
  status?: string;
  links?: Array<{
    href: string;
    rel: string;
    method: string;
  }>;
}

interface PayPalCaptureResponse {
  success: boolean;
  capture_id?: string;
  status?: string;
  order_id?: string;
  message?: string;
}

interface ErrorResponse {
  error?: string;
  detail?: string;
  message?: string;
}

interface CountryOption {
  value: string;
  label: string;
}

interface ExchangeRates {
  base: string;
  date: string;
  rates: Record<string, number>;
}

// ========== Constants ==========
const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000";
const PAYPAL_CLIENT_ID = import.meta.env.VITE_PAYPAL_CLIENT_ID || "";
const PAYPAL_CURRENCY = import.meta.env.VITE_PAYPAL_CURRENCY || "USD";
const BASE_CURRENCY = "USD";
const MIN_AMOUNT = 0.01;
const MAX_AMOUNT = 10000; // Adjust based on your business needs
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const API_TIMEOUT = 15000; // 15 seconds

// Supported PayPal currencies
const SUPPORTED_CURRENCIES = ["USD", "EUR", "GBP", "CAD", "AUD", "JPY"];

// Exhaustive list of countries based on ISO 3166-1 alpha-2
const COUNTRIES: CountryOption[] = [
  { value: "AF", label: "Afghanistan" },
  { value: "AL", label: "Albania" },
  { value: "AS", label: "American Samoa" },
  { value: "AD", label: "Andorra" },
  { value: "AO", label: "Angola" },
  { value: "AI", label: "Anguilla" },
  { value: "AQ", label: "Antarctica" },
  { value: "AG", label: "Antigua and Barbuda" },
  { value: "AR", label: "Argentina" },
  { value: "AM", label: "Armenia" },
  { value: "AW", label: "Aruba" },
  { value: "AU", label: "Australia" },
  { value: "AT", label: "Austria" },
  { value: "AZ", label: "Azerbaijan" },
  { value: "BS", label: "Bahamas (the)" },
  { value: "BH", label: "Bahrain" },
  { value: "BD", label: "Bangladesh" },
  { value: "BB", label: "Barbados" },
  { value: "BY", label: "Belarus" },
  { value: "BE", label: "Belgium" },
  { value: "BZ", label: "Belize" },
  { value: "BJ", label: "Benin" },
  { value: "BM", label: "Bermuda" },
  { value: "BT", label: "Bhutan" },
  { value: "BO", label: "Bolivia" },
  { value: "BQ", label: "Bonaire, Sint Eustatius and Saba" },
  { value: "BA", label: "Bosnia and Herzegovina" },
  { value: "BW", label: "Botswana" },
  { value: "BV", label: "Bouvet Island" },
  { value: "BR", label: "Brazil" },
  { value: "BN", label: "Brunei Darussalam" },
  { value: "BG", label: "Bulgaria" },
  { value: "BF", label: "Burkina Faso" },
  { value: "BI", label: "Burundi" },
  { value: "CV", label: "Cabo Verde" },
  { value: "KH", label: "Cambodia" },
  { value: "CM", label: "Cameroon" },
  { value: "CA", label: "Canada" },
  { value: "CF", label: "Central African Republic" },
  { value: "CL", label: "Chile" },
  { value: "CN", label: "China" },
  { value: "CO", label: "Colombia" },
  { value: "CD", label: "DR. Congo" },
  { value: "CG", label: "Congo (the)" },
  { value: "CR", label: "Costa Rica" },
  { value: "HR", label: "Croatia" },
  { value: "CU", label: "Cuba" },
  { value: "CY", label: "Cyprus" },
  { value: "CZ", label: "Czechia" },
  { value: "CI", label: "Côte d'Ivoire" },
  { value: "DK", label: "Denmark" },
  { value: "DJ", label: "Djibouti" },
  { value: "DM", label: "Dominica" },
  { value: "DO", label: "Dominican Republic" },
  { value: "EC", label: "Ecuador" },
  { value: "EG", label: "Egypt" },
  { value: "GQ", label: "Equatorial Guinea" },
  { value: "ER", label: "Eritrea" },
  { value: "EE", label: "Estonia" },
  { value: "ET", label: "Ethiopia" },
  { value: "FK", label: "Falkland Islands [Malvinas]" },
  { value: "FO", label: "Faroe Islands" },
  { value: "FJ", label: "Fiji" },
  { value: "FI", label: "Finland" },
  { value: "FR", label: "France" },
  { value: "GF", label: "French Guiana" },
  { value: "GA", label: "Gabon" },
  { value: "GM", label: "Gambia" },
  { value: "GE", label: "Georgia" },
  { value: "DE", label: "Germany" },
  { value: "GH", label: "Ghana" },
  { value: "GI", label: "Gibraltar" },
  { value: "GR", label: "Greece" },
  { value: "GL", label: "Greenland" },
  { value: "GD", label: "Grenada" },
  { value: "GP", label: "Guadeloupe" },
  { value: "GU", label: "Guam" },
  { value: "GT", label: "Guatemala" },
  { value: "GN", label: "Guinea" },
  { value: "GW", label: "Guinea-Bissau" },
  { value: "GY", label: "Guyana" },
  { value: "HT", label: "Haiti" },
  { value: "HN", label: "Honduras" },
  { value: "HK", label: "Hong Kong" },
  { value: "HU", label: "Hungary" },
  { value: "IS", label: "Iceland" },
  { value: "IN", label: "India" },
  { value: "ID", label: "Indonesia" },
  { value: "IR", label: "Iran" },
  { value: "IQ", label: "Iraq" },
  { value: "IE", label: "Ireland" },
  { value: "IL", label: "Israel" },
  { value: "IT", label: "Italy" },
  { value: "JM", label: "Jamaica" },
  { value: "JP", label: "Japan" },
  { value: "JO", label: "Jordan" },
  { value: "KE", label: "Kenya" },
  { value: "KI", label: "Kiribati" },
  { value: "KG", label: "Kyrgyzstan" },
  { value: "LA", label: "Lao People's Democratic Republic" },
  { value: "LV", label: "Latvia" },
  { value: "LB", label: "Lebanon" },
  { value: "LS", label: "Lesotho" },
  { value: "LR", label: "Liberia" },
  { value: "LY", label: "Libya" },
  { value: "LI", label: "Liechtenstein" },
  { value: "LT", label: "Lithuania" },
  { value: "LU", label: "Luxembourg" },
  { value: "MO", label: "Macao" },
  { value: "MG", label: "Madagascar" },
  { value: "MW", label: "Malawi" },
  { value: "MY", label: "Malaysia" },
  { value: "MV", label: "Maldives" },
  { value: "ML", label: "Mali" },
  { value: "MT", label: "Malta" },
  { value: "MH", label: "Marshall Islands" },
  { value: "MR", label: "Mauritania" },
  { value: "MU", label: "Mauritius" },
  { value: "MX", label: "Mexico" },
  { value: "MD", label: "Moldova" },
  { value: "MC", label: "Monaco" },
  { value: "MN", label: "Mongolia" },
  { value: "MA", label: "Morocco" },
  { value: "MZ", label: "Mozambique" },
  { value: "MM", label: "Myanmar" },
  { value: "NA", label: "Namibia" },
  { value: "NR", label: "Nauru" },
  { value: "NP", label: "Nepal" },
  { value: "NL", label: "Netherlands" },
  { value: "NC", label: "New Caledonia" },
  { value: "NZ", label: "New Zealand" },
  { value: "NI", label: "Nicaragua" },
  { value: "NE", label: "Niger" },
  { value: "NG", label: "Nigeria" },
  { value: "NU", label: "Niue" },
  { value: "NF", label: "Norfolk Island" },
  { value: "MP", label: "Northern Mariana Islands" },
  { value: "NO", label: "Norway" },
  { value: "OM", label: "Oman" },
  { value: "PK", label: "Pakistan" },
  { value: "PW", label: "Palau" },
  { value: "PS", label: "Palestine, State of" },
  { value: "PA", label: "Panama" },
  { value: "PG", label: "Papua New Guinea" },
  { value: "PY", label: "Paraguay" },
  { value: "PE", label: "Peru" },
  { value: "PH", label: "Philippines" },
  { value: "PN", label: "Pitcairn" },
  { value: "PL", label: "Poland" },
  { value: "PT", label: "Portugal" },
  { value: "PR", label: "Puerto Rico" },
  { value: "QA", label: "Qatar" },
  { value: "MK", label: "Republic of North Macedonia" },
  { value: "RO", label: "Romania" },
  { value: "RU", label: "Russian Federation" },
  { value: "RW", label: "Rwanda" },
  { value: "RE", label: "Réunion" },
  { value: "BL", label: "Saint Barthélemy" },
  { value: "SH", label: "Saint Helena, Ascension and Tristan da Cunha" },
  { value: "KN", label: "Saint Kitts and Nevis" },
  { value: "LC", label: "Saint Lucia" },
  { value: "MF", label: "Saint Martin (French part)" },
  { value: "PM", label: "Saint Pierre and Miquelon" },
  { value: "VC", label: "Saint Vincent and the Grenadines" },
  { value: "WS", label: "Samoa" },
  { value: "SM", label: "San Marino" },
  { value: "ST", label: "Sao Tome and Principe" },
  { value: "SA", label: "Saudi Arabia" },
  { value: "SN", label: "Senegal" },
  { value: "RS", label: "Serbia" },
  { value: "SC", label: "Seychelles" },
  { value: "SL", label: "Sierra Leone" },
  { value: "SG", label: "Singapore" },
  { value: "SX", label: "Sint Maarten" },
  { value: "SK", label: "Slovakia" },
  { value: "SI", label: "Slovenia" },
  { value: "SB", label: "Solomon Islands" },
  { value: "SO", label: "Somalia" },
  { value: "ZA", label: "South Africa" },
  { value: "GS", label: "South Georgia and the South Sandwich Islands" },
  { value: "SS", label: "South Sudan" },
  { value: "ES", label: "Spain" },
  { value: "LK", label: "Sri Lanka" },
  { value: "SD", label: "Sudan" },
  { value: "SR", label: "Suriname" },
  { value: "SJ", label: "Svalbard and Jan Mayen" },
  { value: "SE", label: "Sweden" },
  { value: "CH", label: "Switzerland" },
  { value: "SY", label: "Syrian Arab Republic" },
  { value: "TW", label: "Taiwan (Province of China)" },
  { value: "TJ", label: "Tajikistan" },
  { value: "TZ", label: "Tanzania, United Republic of" },
  { value: "TH", label: "Thailand" },
  { value: "TL", label: "Timor-Leste" },
  { value: "TG", label: "Togo" },
  { value: "TK", label: "Tokelau" },
  { value: "TO", label: "Tonga" },
  { value: "TT", label: "Trinidad and Tobago" },
  { value: "TN", label: "Tunisia" },
  { value: "TR", label: "Turkey" },
  { value: "TM", label: "Turkmenistan" },
  { value: "TC", label: "Turks and Caicos Islands" },
  { value: "TV", label: "Tuvalu" },
  { value: "UG", label: "Uganda" },
  { value: "UA", label: "Ukraine" },
  { value: "AE", label: "United Arab Emirates" },
  {
    value: "GB",
    label: "United Kingdom of Great Britain and Northern Ireland",
  },
  { value: "US", label: "United States of America" },
  { value: "UY", label: "Uruguay" },
  { value: "UZ", label: "Uzbekistan" },
  { value: "VU", label: "Vanuatu" },
  { value: "VE", label: "Venezuela (Bolivarian Republic of)" },
  { value: "VN", label: "Viet Nam" },
  { value: "VG", label: "Virgin Islands (British)" },
  { value: "VI", label: "Virgin Islands (U.S.)" },
  { value: "WF", label: "Wallis and Futuna" },
  { value: "YE", label: "Yemen" },
  { value: "ZM", label: "Zambia" },
  { value: "ZW", label: "Zimbabwe" },
  { value: "AX", label: "Åland Islands" },
];

// ========== Utility Functions ==========
const validateEmail = (email: string): boolean => {
  return EMAIL_REGEX.test(email.trim());
};

const getAuthToken = (): string => {
  const token = localStorage.getItem("token");
  if (!token) {
    throw new Error("Authentication token not found");
  }
  return token;
};

const formatAmount = (amount: number): string => {
  return amount.toFixed(2);
};

const getErrorMessage = (error: unknown): string => {
  if (axios.isAxiosError(error)) {
    const axiosError = error as AxiosError<ErrorResponse>;
    return (
      axiosError.response?.data?.error ||
      axiosError.response?.data?.detail ||
      axiosError.response?.data?.message ||
      axiosError.message ||
      "An unexpected error occurred"
    );
  }

  if (error instanceof Error) {
    return error.message;
  }

  return "An unexpected error occurred";
};

// Function to get user's country from IP using IPinfo (unlimited free country-level)
const getUserCountry = async (
  maxRetries: number = 2
): Promise<string | null> => {
  const timeout = 5000; // 5 seconds timeout

  for (let attempt = 1; attempt <= maxRetries + 1; attempt++) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);

      const response = await fetch("https://ipinfo.io/json", {
        method: "GET",
        headers: {
          "User-Agent": "YourApp/1.0",
        },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(
          `HTTP error! Status: ${response.status} ${response.statusText}`
        );
      }

      let data;
      try {
        data = await response.json();
      } catch {
        throw new Error("Failed to parse location data as JSON");
      }

      if (!data || typeof data !== "object") {
        throw new Error("Invalid location data received");
      }

      const countryCode = data.country;

      if (!countryCode || typeof countryCode !== "string") {
        return null;
      }

      // Check if the country code exists in COUNTRIES
      const isValidCountry = COUNTRIES.some((c) => c.value === countryCode);
      if (!isValidCountry) {
        console.warn(
          `Detected country code '${countryCode}' not in supported list, requiring manual selection`
        );
        return null;
      }

      return countryCode;
    } catch (error) {
      const err = error as Error;
      console.error(
        `Attempt ${attempt} failed to detect user country from IP:`,
        err.message
      );

      // Distinguish error types
      if (err.name === "AbortError") {
        console.error("Request timed out");
        if (attempt > maxRetries) {
          return null; // Fallback after retries
        }
        // Wait before retry for timeout
        await new Promise((resolve) => setTimeout(resolve, 1000 * attempt));
        continue;
      }

      if (err.name === "TypeError" && err.message.includes("fetch")) {
        console.error("Network error - no internet connection");
        if (attempt > maxRetries) {
          return null;
        }
        // Wait before retry for network error
        await new Promise((resolve) => setTimeout(resolve, 2000 * attempt));
        continue;
      }

      // For other errors, if last attempt, fallback
      if (attempt > maxRetries) {
        return null;
      }

      // Wait before retry
      await new Promise((resolve) => setTimeout(resolve, 1000 * attempt));
    }
  }

  // Fallback if all retries exhausted
  console.error(
    "All attempts to detect user country failed, requiring manual selection"
  );
  return null;
};

// Function to fetch local currency for country
const fetchLocalCurrency = async (countryCode: string): Promise<string> => {
  try {
    const response = await fetch(
      `https://restcountries.com/v3.1/alpha/${countryCode}?fields=currencies`
    );
    if (!response.ok) throw new Error("Failed to fetch country data");
    const data = await response.json();
    const currencies = data[0]?.currencies;
    if (!currencies || typeof currencies !== "object") return BASE_CURRENCY;
    const currencyCode = Object.keys(currencies)[0];
    return currencyCode || BASE_CURRENCY;
  } catch {
    return BASE_CURRENCY;
  }
};

// Function to fetch exchange rates from Currency Beacon
const fetchExchangeRates = async (): Promise<ExchangeRates | null> => {
  try {
    const response = await fetch(
      `https://api.currencybeacon.com/v1/latest?api_key=${
        import.meta.env.VITE_CURRENCY_BEACON_API_KEY
      }&base=${BASE_CURRENCY}`
    );
    if (!response.ok) throw new Error("Failed to fetch exchange rates");
    const data: ExchangeRates = await response.json();
    console.log(data);
    return data;
  } catch {
    return null;
  }
};

// ========== Main Component ==========
const PayWithPayPalPage = () => {
  const cartItems = useSelector((state: RootState) => state.aoiCart.items);
  const navigate = useNavigate();
  const location = useLocation();
  const {
    durationType = "months",
    durationValue = 1,
    totalCost = 0,
  } = (location.state as LocationState) || {};

  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [country, setCountry] = useState(""); // Initial empty
  const [countryLoading, setCountryLoading] = useState(true);
  const [emailError, setEmailError] = useState("");
  const [localOrderId, setLocalOrderId] = useState<string | null>(null);
  const [scriptError, setScriptError] = useState(false);
  const [localCurrency, setLocalCurrency] = useState(BASE_CURRENCY);
  const [convertedAmount, setConvertedAmount] = useState(totalCost);
  const [currencyLoading, setCurrencyLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [searchValue, setSearchValue] = useState("");
  const [exchangeRates, setExchangeRates] = useState<ExchangeRates | null>(
    null
  );

  // Fetch exchange rates on mount (cached for session)
  useEffect(() => {
    const loadRates = async () => {
      const rates = await fetchExchangeRates();
      setExchangeRates(rates);
      if (!rates) {
        toast.error("Could not fetch exchange rates. Displaying in USD.", {
          style: { background: "#1f2937", color: "#fff" },
          icon: "⚠️",
          duration: 3000,
        });
      }
    };
    loadRates();
  }, []);

  // Detect user's country on mount
  useEffect(() => {
    setCountryLoading(true);
    getUserCountry()
      .then((detectedCountry) => {
        setCountryLoading(false);
        if (detectedCountry) {
          setCountry(detectedCountry);
        } else {
          toast.error(
            "Could not detect your country automatically. Please select it manually.",
            {
              style: { background: "#1f2937", color: "#fff" },
              icon: "🌍",
              duration: 5000,
            }
          );
        }
      })
      .catch((error) => {
        console.error("Unexpected error in getUserCountry:", error);
        setCountryLoading(false);
        toast.error(
          "Could not detect your country automatically. Please select it manually.",
          {
            style: { background: "#1f2937", color: "#fff" },
            icon: "🌍",
            duration: 5000,
          }
        );
      });
  }, []);

  // Update currency on country change (using cached rates)
  useEffect(() => {
    if (!country || country === "") return;

    const updateCurrency = async () => {
      setCurrencyLoading(true);
      try {
        const localCurr = await fetchLocalCurrency(country);
        setLocalCurrency(localCurr);

        if (localCurr === BASE_CURRENCY) {
          setConvertedAmount(totalCost);
          setCurrencyLoading(false);
          return;
        }

        if (!exchangeRates || !exchangeRates.rates[localCurr]) {
          setConvertedAmount(totalCost); // Fallback
          toast.error("Exchange rate not available. Displaying in USD.", {
            style: { background: "#1f2937", color: "#fff" },
            icon: "⚠️",
            duration: 3000,
          });
          setCurrencyLoading(false);
          return;
        }

        setConvertedAmount(totalCost * exchangeRates.rates[localCurr]);
      } catch (error) {
        console.error("Error fetching currency data:", error);
        setLocalCurrency(BASE_CURRENCY);
        setConvertedAmount(totalCost);
      } finally {
        setCurrencyLoading(false);
      }
    };

    updateCurrency();
  }, [country, totalCost, exchangeRates]);

  // ========== Validation on Mount ==========
  useEffect(() => {
    // Validate PayPal configuration
    if (!PAYPAL_CLIENT_ID || PAYPAL_CLIENT_ID === "YOUR_PAYPAL_CLIENT_ID") {
      setScriptError(true);
      toast.error("Payment system not configured. Please contact support.", {
        style: { background: "#1f2937", color: "#fff" },
        icon: "⚠️",
        duration: 6000,
      });
      return;
    }

    // Validate currency
    if (!SUPPORTED_CURRENCIES.includes(PAYPAL_CURRENCY)) {
      toast.error("Invalid payment currency configuration.", {
        style: { background: "#1f2937", color: "#fff" },
        icon: "⚠️",
      });
    }
  }, []);

  // ========== Redirect if Invalid State ==========
  useEffect(() => {
    if (!cartItems || cartItems.length === 0) {
      toast.error("No items in cart. Redirecting to checkout...", {
        style: { background: "#1f2937", color: "#fff" },
        icon: "⚠️",
      });
      navigate("/checkout", { replace: true });
      return;
    }

    if (totalCost < MIN_AMOUNT) {
      toast.error("Invalid order amount. Redirecting to checkout...", {
        style: { background: "#1f2937", color: "#fff" },
        icon: "⚠️",
      });
      navigate("/checkout", { replace: true });
      return;
    }

    if (totalCost > MAX_AMOUNT) {
      toast.error(
        `Maximum order amount is $${MAX_AMOUNT}. Please contact support.`,
        {
          style: { background: "#1f2937", color: "#fff" },
          icon: "⚠️",
        }
      );
      navigate("/checkout", { replace: true });
    }
  }, [cartItems, totalCost, navigate]);

  // ========== Email Validation ==========
  const handleEmailChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value;
      setEmail(value);

      if (value && !validateEmail(value)) {
        setEmailError("Please enter a valid email address");
      } else {
        setEmailError("");
      }
    },
    []
  );

  // Filter countries for combobox
  const filterCountries = useCallback(
    (value: string, countries: CountryOption[]) => {
      return countries.filter((country) =>
        country.label.toLowerCase().includes(value.toLowerCase())
      );
    },
    []
  );

  // ========== Create Backend Order ==========
  const createBackendOrder = useCallback(
    async (userEmail: string, selectedCountry: string): Promise<string> => {
      try {
        const orderPayload: OrderPayload = {
          items: cartItems.map((item) => ({
            id: String(item.id),
            name: item.name,
            area: item.area,
            type: item.type,
            monitoring_enabled: true,
            is_active: true,
          })),
          email: userEmail,
          country: selectedCountry,
          duration: { type: durationType, value: durationValue },
          total_cost: totalCost,
        };

        const response = await axios.post<BackendOrderResponse>(
          `${API_BASE_URL}/orders/create/`,
          orderPayload,
          {
            headers: {
              Authorization: `Bearer ${getAuthToken()}`,
              "Content-Type": "application/json",
            },
            timeout: API_TIMEOUT,
          }
        );

        if (!response.data?.order_id) {
          throw new Error("Invalid response from server: missing order_id");
        }

        return response.data.order_id;
      } catch (error) {
        if (axios.isAxiosError(error)) {
          const axiosError = error as AxiosError<ErrorResponse>;

          if (axiosError.response?.status === 401) {
            toast.error("Session expired. Please log in again.", {
              style: { background: "#1f2937", color: "#fff" },
              icon: "🔒",
            });
            navigate("/login", { replace: true });
            return "";
          }
        }

        const errorMessage = getErrorMessage(error);
        throw new Error(errorMessage);
      }
    },
    [cartItems, durationType, durationValue, totalCost, navigate]
  );

  // ========== PayPal Create Order Handler ==========
  const createOrder = useCallback(
    async (
      data: CreateOrderData,
      actions: CreateOrderActions
    ): Promise<string> => {
      // Log create order parameters for debugging
      console.debug("PayPal createOrder data:", data);
      console.debug("PayPal createOrder actions:", actions);

      // Validate email before proceeding
      if (!email.trim()) {
        toast.error("Please enter your email address.", {
          style: { background: "#1f2937", color: "#fff" },
          icon: "⚠️",
        });
        throw new Error("Email is required");
      }

      if (!validateEmail(email)) {
        toast.error("Please enter a valid email address.", {
          style: { background: "#1f2937", color: "#fff" },
          icon: "⚠️",
        });
        throw new Error("Invalid email format");
      }

      // Validate country
      if (!country) {
        toast.error("Please select your country.", {
          style: { background: "#1f2937", color: "#fff" },
          icon: "⚠️",
        });
        throw new Error("Country is required");
      }

      setLoading(true);

      try {
        // Create or retrieve backend order ID
        let currentOrderId = localOrderId;
        if (!currentOrderId) {
          currentOrderId = await createBackendOrder(email.trim(), country);
          if (!currentOrderId) throw new Error("Failed to create order");
          setLocalOrderId(currentOrderId);
        }

        // Create PayPal order on backend with aggregated item
        const response = await axios.post<PayPalOrderResponse>(
          `${API_BASE_URL}/payments/paypal/create-order/`,
          {
            amount: formatAmount(totalCost),
            currency: PAYPAL_CURRENCY,
            order_id: currentOrderId,
            email: email.trim(),
            country: country,
            description: `Order #${currentOrderId} - ${cartItems.length} AOI Monitoring item(s) for ${country}`,
            items: [
              {
                name: "AOI Monitoring Service",
                quantity: 1,
                unit_amount: {
                  currency_code: PAYPAL_CURRENCY,
                  value: formatAmount(totalCost),
                },
              },
            ],
          },
          {
            headers: {
              Authorization: `Bearer ${getAuthToken()}`,
              "Content-Type": "application/json",
            },
            timeout: API_TIMEOUT,
          }
        );

        if (!response.data?.id) {
          throw new Error("Failed to create PayPal order: missing order ID");
        }

        toast.success("Order created successfully!", {
          style: { background: "#1f2937", color: "#fff" },
          icon: "✅",
          duration: 2000,
        });

        return response.data.id; // Return PayPal order ID
      } catch (error) {
        const errorMessage = getErrorMessage(error);

        toast.error(errorMessage, {
          style: { background: "#1f2937", color: "#fff" },
          icon: "❌",
        });

        throw error; // PayPal SDK will handle this
      } finally {
        setLoading(false);
      }
    },
    [
      email,
      country,
      localOrderId,
      totalCost,
      cartItems.length,
      createBackendOrder,
    ]
  );

  // ========== PayPal Approve Handler ==========
  const onApprove = useCallback(
    async (data: OnApproveData, actions: OnApproveActions): Promise<void> => {
      // Log approve actions for debugging
      console.debug("PayPal onApprove actions:", actions);

      setLoading(true);

      try {
        // Capture the payment on backend
        const response = await axios.post<PayPalCaptureResponse>(
          `${API_BASE_URL}/payments/paypal/capture-order/`,
          {
            paypal_order_id: data.orderID,
            backend_order_id: localOrderId,
            payer_id: data.payerID,
            email: email.trim(),
            country: country,
          },
          {
            headers: {
              Authorization: `Bearer ${getAuthToken()}`,
              "Content-Type": "application/json",
            },
            timeout: API_TIMEOUT,
          }
        );

        if (!response.data?.success) {
          throw new Error(
            response.data?.message || "Failed to capture payment"
          );
        }

        toast.success("Payment successful! Redirecting...", {
          style: { background: "#1f2937", color: "#fff" },
          icon: "✅",
          duration: 2000,
        });

        // Redirect to success page with order details
        setTimeout(() => {
          navigate("/payment-success", {
            replace: true,
            state: {
              orderId: localOrderId,
              captureId: response.data.capture_id,
              amount: totalCost,
              email: email.trim(),
              country: country,
              paymentMethod: "PayPal",
            },
          });
        }, 1500);
      } catch (error) {
        const errorMessage = getErrorMessage(error);

        toast.error(errorMessage, {
          style: { background: "#1f2937", color: "#fff" },
          icon: "❌",
          duration: 5000,
        });

        // Optionally redirect to failure page
        navigate("/payment-failed", {
          replace: true,
          state: {
            error: errorMessage,
            orderId: localOrderId,
          },
        });
      } finally {
        setLoading(false);
      }
    },
    [email, country, localOrderId, totalCost, navigate]
  );

  // ========== PayPal Error Handler ==========
  const onError = useCallback((err: Record<string, unknown>) => {
    const errorMessage =
      typeof err.message === "string"
        ? err.message
        : "Payment error occurred. Please try again.";

    toast.error(errorMessage, {
      style: { background: "#1f2937", color: "#fff" },
      icon: "❌",
      duration: 5000,
    });

    setLoading(false);
  }, []);

  // ========== PayPal Cancel Handler ==========
  const onCancel = useCallback(() => {
    toast("Payment was cancelled.", {
      style: { background: "#1f2937", color: "#fff" },
      icon: "ℹ️",
    });

    setLoading(false);
  }, []);

  // ========== PayPal Script Options ==========
  const paypalOptions = useMemo(
    () => ({
      clientId: PAYPAL_CLIENT_ID,
      currency: PAYPAL_CURRENCY,
      intent: "capture" as const,
      vault: false,
      components: "buttons",
      "data-page-type": "checkout", // Use data attributes for better compatibility
      locale: "en_US" as const, // Default locale; can be dynamic based on country if needed
      disableFunding: "credit,card", // Optional: disable credit card option
    }),
    []
  );

  // ========== PayPal Button Style ==========
  const buttonStyle = useMemo(
    () => ({
      layout: "vertical" as const,
      color: "gold" as const,
      shape: "rect" as const,
      label: "paypal" as const,
      height: 45,
    }),
    []
  );

  // ========== Disable PayPal Button Condition ==========
  const isPayPalDisabled = useMemo(
    () =>
      !email.trim() ||
      !!emailError ||
      !country ||
      loading ||
      scriptError ||
      countryLoading,
    [email, emailError, country, loading, scriptError, countryLoading]
  );

  const selectedCountryLabel = useMemo(() => {
    return country
      ? COUNTRIES.find((c) => c.value === country)?.label || ""
      : "";
  }, [country]);

  // Early return for script error to avoid rendering PayPal
  if (scriptError) {
    return (
      <div className="w-full min-h-screen bg-black text-white py-12 px-4 md:px-8">
        <Toaster position="top-right" toastOptions={{ duration: 4000 }} />
        <motion.div
          className="max-w-md mx-auto"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <Card className="bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl">
            <CardHeader className="p-6 border-b border-zinc-800">
              <CardTitle className="text-xl font-semibold text-gray-200 text-center">
                Payment Error
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="bg-red-900/20 border border-red-500 rounded-lg p-4">
                <p className="text-red-400 text-sm text-center">
                  ⚠️ Payment system unavailable. Please contact support or try
                  again later.
                </p>
              </div>
              <Button
                onClick={() => navigate("/checkout")}
                variant="outline"
                className="w-full mt-4 bg-zinc-800 border-zinc-600 hover:bg-zinc-700 text-gray-200 transition-colors"
              >
                Back to Checkout
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    );
  }

  // Skeleton loader for overall payment processing
  if (loading) {
    return (
      <div className="w-full min-h-screen bg-black text-white py-12 px-4 md:px-8">
        <Toaster position="top-right" toastOptions={{ duration: 4000 }} />
        <motion.div
          className="max-w-md mx-auto"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <Card className="bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl">
            <CardHeader className="p-6 border-b border-zinc-800">
              <Skeleton className="h-8 w-3/4 mx-auto mb-2" />
              <Skeleton className="h-4 w-1/2 mx-auto" />
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              {/* Order Summary Skeleton */}
              <div className="bg-zinc-800 rounded-lg p-4 space-y-2">
                <Skeleton className="h-4 w-1/4" />
                <Skeleton className="h-4 w-1/3" />
                <div className="flex justify-between pt-2 border-t border-zinc-700">
                  <Skeleton className="h-6 w-1/4" />
                  <Skeleton className="h-6 w-1/5" />
                </div>
              </div>

              {/* Email Input Skeleton */}
              <div className="space-y-2">
                <Skeleton className="h-4 w-1/3" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-3 w-3/4" />
              </div>

              {/* Country Select Skeleton */}
              <div className="space-y-2">
                <Skeleton className="h-4 w-1/3" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-3 w-3/4" />
              </div>

              {/* PayPal Button Skeleton */}
              <div className="space-y-3">
                <Skeleton className="h-12 w-full" />
              </div>

              {/* Security & Info Skeleton */}
              <div className="space-y-2">
                <Skeleton className="h-3 w-1/2 mx-auto" />
                <Skeleton className="h-3 w-2/3 mx-auto" />
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    );
  }

  // ========== Render ==========
  return (
    <div className="w-full min-h-screen bg-black text-white py-12 px-4 md:px-8">
      <Toaster position="top-right" toastOptions={{ duration: 4000 }} />

      <motion.div
        className="max-w-md mx-auto"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <Card className="bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl">
          <CardHeader className="p-6 border-b border-zinc-800">
            <CardTitle className="text-xl font-semibold text-gray-200 text-center">
              Complete Your Payment
            </CardTitle>
            <p className="text-sm text-gray-400 text-center mt-2">
              Secure payment powered by PayPal
            </p>
          </CardHeader>

          <CardContent className="p-6 space-y-6">
            {/* Order Summary */}
            <div className="bg-zinc-800 rounded-lg p-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Items</span>
                <span className="text-gray-200">{cartItems.length}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Duration</span>
                <span className="text-gray-200">
                  {durationValue} {durationType}
                </span>
              </div>
              <div className="flex justify-between text-lg font-semibold pt-2 border-t border-zinc-700">
                <span className="text-gray-200">Total ({PAYPAL_CURRENCY})</span>
                <span className="text-blue-400">
                  {formatAmount(totalCost)} {PAYPAL_CURRENCY}
                </span>
              </div>
              {country && localCurrency !== BASE_CURRENCY && (
                <div className="flex justify-between text-sm pt-1">
                  <span className="text-gray-400">
                    Approx. ({localCurrency})
                  </span>
                  <span className="text-green-400">
                    {currencyLoading ? (
                      <Skeleton className="h-4 w-16" />
                    ) : (
                      formatAmount(convertedAmount)
                    )}{" "}
                    {localCurrency}
                  </span>
                </div>
              )}
            </div>

            {/* Email Input */}
            <div className="space-y-2">
              <Label htmlFor="email" className="text-gray-300">
                Email Address *
              </Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={handleEmailChange}
                placeholder="your@email.com"
                className={`bg-zinc-800 border ${
                  emailError ? "border-red-500" : "border-zinc-600"
                } text-white focus:border-blue-500 transition-colors`}
                required
                disabled={loading}
                aria-invalid={!!emailError}
                aria-describedby={emailError ? "email-error" : undefined}
              />
              {emailError && (
                <p id="email-error" className="text-red-400 text-sm mt-1">
                  {emailError}
                </p>
              )}
              <p className="text-xs text-gray-500">
                Receipt will be sent to this email address
              </p>
            </div>

            {/* Country Combobox */}
            <div className="space-y-2">
              <Label htmlFor="country" className="text-gray-300">
                Country *
              </Label>
              {countryLoading ? (
                <Skeleton className="h-10 w-full border border-zinc-600 bg-zinc-800" />
              ) : (
                <Popover open={open} onOpenChange={setOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={open}
                      className="w-full justify-between bg-zinc-800 border-zinc-600 text-white hover:bg-zinc-700 focus:border-blue-500 transition-colors"
                      disabled={loading}
                    >
                      <div className="flex items-center gap-2 flex-1 justify-start">
                        {country ? (
                          <>
                            <img
                              src={`https://flagcdn.com/w20/${country.toLowerCase()}.png`}
                              alt={`${selectedCountryLabel} flag`}
                              className="w-5 h-4 rounded"
                            />
                            <span>{selectedCountryLabel}</span>
                          </>
                        ) : (
                          <span className="text-gray-500">
                            Select a country
                          </span>
                        )}
                      </div>
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-full p-0 bg-zinc-800 border-zinc-600 text-white max-h-60">
                    <Command>
                      <CommandInput
                        placeholder="Search country..."
                        value={searchValue}
                        onValueChange={setSearchValue}
                        className="bg-zinc-800 border-b-zinc-600 text-white"
                      />
                      <CommandList>
                        <CommandEmpty>No country found.</CommandEmpty>
                        <CommandGroup>
                          {filterCountries(searchValue, COUNTRIES).map((c) => (
                            <CommandItem
                              key={c.value}
                              value={c.value}
                              onSelect={() => {
                                setCountry(c.value === country ? "" : c.value);
                                setOpen(false);
                                setSearchValue("");
                              }}
                              className="flex items-center gap-2 cursor-pointer text-white hover:bg-zinc-700"
                            >
                              <img
                                src={`https://flagcdn.com/w20/${c.value.toLowerCase()}.png`}
                                alt={`${c.label} flag`}
                                className="w-5 h-4 rounded"
                              />
                              <span>{c.label}</span>
                              <Check
                                className={`ml-auto h-4 w-4 ${
                                  country === c.value
                                    ? "opacity-100"
                                    : "opacity-0"
                                }`}
                              />
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
              )}
              <p className="text-xs text-gray-500">
                Select your billing country
              </p>
            </div>

            {/* PayPal Buttons */}
            {PAYPAL_CLIENT_ID && (
              <div className="space-y-3 relative">
                <PayPalScriptProvider options={paypalOptions}>
                  <div
                    className={
                      isPayPalDisabled ? "opacity-50 pointer-events-none" : ""
                    }
                  >
                    <PayPalButtons
                      createOrder={createOrder}
                      onApprove={onApprove}
                      onError={onError}
                      onCancel={onCancel}
                      style={buttonStyle}
                      disabled={isPayPalDisabled}
                      forceReRender={[email, country, totalCost]}
                    />
                  </div>
                </PayPalScriptProvider>

                {isPayPalDisabled && !loading && !countryLoading && (
                  <p className="text-xs text-yellow-400 text-center">
                    ⚠️ Please enter a valid email and select your country to
                    continue
                  </p>
                )}
              </div>
            )}

            {/* Security & Info */}
            <div className="space-y-2">
              <p className="text-xs text-gray-500 text-center">
                🔒 Your payment is secure and encrypted
              </p>
              <p className="text-xs text-gray-500 text-center">
                You can pay with your PayPal balance or linked cards
              </p>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};

export default PayWithPayPalPage;

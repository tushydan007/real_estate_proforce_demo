import { useState, useEffect, useCallback } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import client from "../lib/client";
import { Link, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";

// ============= TYPES =============
interface ApiError {
  response?: {
    status?: number;
    data?: {
      detail?: string;
      [key: string]: unknown;
    };
  };
  request?: unknown;
  message?: string;
}

interface Country {
  name: string;
  code: string;
  dial_code: string;
  emoji: string;
}

interface RestCountry {
  cca2: string;
  name: { common: string };
  idd?: { root?: string; suffixes?: string[] };
  flag?: string;
}

interface CachedData {
  data: Country[];
  timestamp: number;
}

// ============= CONSTANTS =============
const CACHE_DURATION = 7 * 24 * 60 * 60 * 1000; // 7 days
const AUTOSAVE_KEY = "orgRegForm";
const COUNTRIES_CACHE_KEY = "countriesCache";

const FALLBACK_COUNTRIES: Country[] = [
  { name: "Australia", code: "AU", dial_code: "+61", emoji: "🇦🇺" },
  { name: "Canada", code: "CA", dial_code: "+1", emoji: "🇨🇦" },
  { name: "China", code: "CN", dial_code: "+86", emoji: "🇨🇳" },
  { name: "France", code: "FR", dial_code: "+33", emoji: "🇫🇷" },
  { name: "Germany", code: "DE", dial_code: "+49", emoji: "🇩🇪" },
  { name: "India", code: "IN", dial_code: "+91", emoji: "🇮🇳" },
  { name: "Japan", code: "JP", dial_code: "+81", emoji: "🇯🇵" },
  { name: "Nigeria", code: "NG", dial_code: "+234", emoji: "🇳🇬" },
  { name: "United Kingdom", code: "GB", dial_code: "+44", emoji: "🇬🇧" },
  { name: "United States", code: "US", dial_code: "+1", emoji: "🇺🇸" },
];

// ============= VALIDATION SCHEMA =============
const organizationalRegSchema = z
  .object({
    companyName: z
      .string()
      .min(1, "Company name is required")
      .min(3, "Company name must be at least 3 characters")
      .max(100, "Company name must not exceed 100 characters")
      .trim(),
    rcNumber: z
      .string()
      .min(1, "RC Number is required")
      .min(5, "RC Number must be at least 5 characters")
      .max(50, "RC Number must not exceed 50 characters")
      .trim(),
    industryType: z
      .string()
      .min(1, "Industry type is required")
      .min(2, "Industry type must be at least 2 characters")
      .max(100, "Industry type must not exceed 100 characters")
      .trim(),
    companyAddress: z
      .string()
      .min(1, "Company address is required")
      .min(10, "Company address must be at least 10 characters")
      .max(200, "Company address must not exceed 200 characters")
      .trim(),
    email: z
      .string()
      .min(1, "Email is required")
      .email("Invalid email address")
      .toLowerCase()
      .trim(),
    password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .max(128, "Password must not exceed 128 characters")
      .regex(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
        "Password must contain at least one uppercase letter, one lowercase letter, and one number"
      ),
    re_password: z.string().min(1, "Password confirmation is required"),
    phoneNumber: z
      .string()
      .min(1, "Phone number is required")
      .min(10, "Phone number must be at least 10 characters")
      .max(20, "Phone number must not exceed 20 characters")
      .regex(
        /^\+?[\d\s\-()]+$/,
        "Invalid phone number format. Use only numbers, spaces, hyphens, and parentheses"
      )
      .trim(),
    website: z
      .union([z.string().url("Invalid URL format").trim(), z.literal("")])
      .optional(),
    country: z.string().min(1, "Country is required"),
    region: z
      .string()
      .min(1, "Region/State is required")
      .max(100, "Region must not exceed 100 characters")
      .trim(),
  })
  .refine((data) => data.password === data.re_password, {
    message: "Passwords do not match",
    path: ["re_password"],
  });

type OrganizationalRegFormData = z.infer<typeof organizationalRegSchema>;

// ============= UTILITY FUNCTIONS =============
const safeLocalStorage = {
  getItem: (key: string): string | null => {
    try {
      return localStorage.getItem(key);
    } catch (error) {
      console.error(`Failed to get item from localStorage: ${key}`, error);
      return null;
    }
  },
  setItem: (key: string, value: string): boolean => {
    try {
      localStorage.setItem(key, value);
      return true;
    } catch (error) {
      console.error(`Failed to set item in localStorage: ${key}`, error);
      return false;
    }
  },
  removeItem: (key: string): boolean => {
    try {
      localStorage.removeItem(key);
      return true;
    } catch (error) {
      console.error(`Failed to remove item from localStorage: ${key}`, error);
      return false;
    }
  },
};

// ============= MAIN COMPONENT =============
export default function OrganizationalRegForm() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [countries, setCountries] = useState<Country[]>([]);
  const [hasLoadedSavedData, setHasLoadedSavedData] = useState(false);
  const [phoneDialCode, setPhoneDialCode] = useState("");

  const totalSteps = 3;
  const steps = [
    { label: "Company Details", step: 1 },
    { label: "Contact Information", step: 2 },
    { label: "Account Credentials", step: 3 },
  ];

  const {
    register,
    handleSubmit,
    trigger,
    watch,
    reset,
    setValue,
    formState: { errors, isValid, isSubmitting },
  } = useForm<OrganizationalRegFormData>({
    resolver: zodResolver(organizationalRegSchema),
    mode: "onChange",
    defaultValues: {
      companyName: "",
      rcNumber: "",
      industryType: "",
      companyAddress: "",
      email: "",
      password: "",
      re_password: "",
      phoneNumber: "",
      website: "",
      country: "",
      region: "",
    },
  });

  const watchedCountry = watch("country");
  const watchedPhone = watch("phoneNumber");
  const watchedData = watch();

  // ============= LOAD COUNTRIES =============
  useEffect(() => {
    const loadCountries = async () => {
      try {
        // Check cache first
        const cached = safeLocalStorage.getItem(COUNTRIES_CACHE_KEY);
        if (cached) {
          const parsedCache: CachedData = JSON.parse(cached);
          const isCacheValid =
            Date.now() - parsedCache.timestamp < CACHE_DURATION;

          if (isCacheValid && Array.isArray(parsedCache.data)) {
            setCountries(parsedCache.data);
            return;
          }
        }

        // Fetch from API
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000);

        const response = await fetch(
          "https://restcountries.com/v3.1/all?fields=name,cca2,idd,flag",
          { signal: controller.signal }
        );

        clearTimeout(timeoutId);

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data: RestCountry[] = await response.json();

        // Process and sort countries
        const processedCountries = data
          .filter((country) => country.cca2 && country.name?.common)
          .map((country) => {
            const dialCode = country.idd?.root
              ? `${country.idd.root}${country.idd.suffixes?.[0] || ""}`
              : "";
            return {
              name: country.name.common,
              code: country.cca2,
              dial_code: dialCode,
              emoji: country.flag || "",
            };
          })
          .sort((a, b) => a.name.localeCompare(b.name));

        setCountries(processedCountries);

        // Cache the data with timestamp
        const cacheData: CachedData = {
          data: processedCountries,
          timestamp: Date.now(),
        };
        safeLocalStorage.setItem(
          COUNTRIES_CACHE_KEY,
          JSON.stringify(cacheData)
        );
      } catch (error) {
        console.error("Failed to load countries:", error);
        setCountries(FALLBACK_COUNTRIES);
        toast.error(
          "Could not load full countries list. Using limited selection."
        );
      }
    };

    loadCountries();
  }, []);

  // ============= LOAD AUTOSAVED DATA =============
  useEffect(() => {
    if (hasLoadedSavedData) return;

    try {
      const savedData = safeLocalStorage.getItem(AUTOSAVE_KEY);
      if (savedData) {
        const parsedData: Partial<OrganizationalRegFormData> =
          JSON.parse(savedData);

        // Only load if data exists and is valid
        if (Object.keys(parsedData).length > 0) {
          reset(parsedData as OrganizationalRegFormData);
          toast.success("Previous form data restored");
        }
      }
    } catch (error) {
      console.error("Failed to load autosaved data:", error);
      safeLocalStorage.removeItem(AUTOSAVE_KEY);
    } finally {
      setHasLoadedSavedData(true);
    }
  }, [reset, hasLoadedSavedData]);

  // ============= AUTOSAVE ON CHANGE =============
  useEffect(() => {
    if (!hasLoadedSavedData) return;

    const hasData = Object.values(watchedData).some(
      (value) => value && value !== ""
    );

    if (hasData) {
      const timeoutId = setTimeout(() => {
        safeLocalStorage.setItem(AUTOSAVE_KEY, JSON.stringify(watchedData));
      }, 1000); // Debounce autosave

      return () => clearTimeout(timeoutId);
    }
  }, [watchedData, hasLoadedSavedData]);

  // ============= AUTO-FILL PHONE COUNTRY CODE =============
  useEffect(() => {
    if (watchedCountry && countries.length > 0) {
      const selectedCountry = countries.find((c) => c.name === watchedCountry);
      if (selectedCountry?.dial_code) {
        setPhoneDialCode(selectedCountry.dial_code);

        // Clear the phone number input when country changes to avoid duplication
        const currentPhone = watchedPhone?.trim() || "";
        // Only clear if it's empty or contains just the old dial code
        if (
          !currentPhone ||
          currentPhone === phoneDialCode ||
          currentPhone === phoneDialCode + " " ||
          currentPhone.startsWith(phoneDialCode)
        ) {
          setValue("phoneNumber", "", {
            shouldValidate: false,
          });
        }
      }
    }
  }, [watchedCountry, countries, phoneDialCode, setValue, watchedPhone]);

  // ============= IP-BASED GEOLOCATION =============
  useEffect(() => {
    const loadGeolocation = async () => {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000);

        const response = await fetch("https://ipapi.co/json/", {
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (!response.ok) return;

        const data = await response.json();

        if (data.country_name && !watchedCountry) {
          setValue("country", data.country_name, { shouldValidate: false });
        }
        if (data.region && !watch("region")) {
          setValue("region", data.region, { shouldValidate: false });
        }
      } catch (error) {
        console.error("Failed to get IP location:", error);
      }
    };

    if (hasLoadedSavedData && countries.length > 0) {
      loadGeolocation();
    }
  }, [hasLoadedSavedData, countries, setValue, watchedCountry, watch]);

  // ============= STEP NAVIGATION =============
  const nextStep = useCallback(async () => {
    const fieldsToValidate: (keyof OrganizationalRegFormData)[][] = [
      ["companyName", "rcNumber", "industryType", "companyAddress"],
      ["email", "phoneNumber", "website", "country", "region"],
      ["password", "re_password"],
    ];

    const fields = fieldsToValidate[currentStep - 1];
    const isStepValid = await trigger(fields);

    if (!isStepValid) {
      toast.error("Please fix the errors before proceeding");
      return;
    }

    setCurrentStep((prev) => Math.min(prev + 1, totalSteps));
  }, [currentStep, trigger, totalSteps]);

  const prevStep = useCallback(() => {
    setCurrentStep((prev) => Math.max(prev - 1, 1));
  }, []);

  // ============= FORM SUBMISSION =============
  const onSubmit = async (data: OrganizationalRegFormData) => {
    setLoading(true);

    try {
      const payload = {
        ...data,
        website: data.website || undefined,
        phoneNumber: data.phoneNumber.trim(),
        email: data.email.toLowerCase().trim(),
      };

      await client.post("/api/auth/org-users/", payload);

      // Clear autosaved data on success
      safeLocalStorage.removeItem(AUTOSAVE_KEY);

      toast.success(
        "Account created successfully! Please check your email to verify."
      );

      // Navigate to verification page
      navigate("/org-verify-email", { replace: true });
    } catch (err: unknown) {
      const apiError = err as ApiError;
      let errorMsg = "An unexpected error occurred. Please try again.";

      if (apiError.response) {
        const status = apiError.response.status;
        const data = apiError.response.data;

        if (status === 400) {
          errorMsg = data?.detail || "Invalid data. Please check your entries.";
        } else if (status === 409 || status === 422) {
          errorMsg =
            data?.detail || "An account with this email already exists.";
        } else if (status && status >= 500) {
          errorMsg = "Server error. Please try again later.";
        } else {
          errorMsg = data?.detail || `Error: ${status}`;
        }
      } else if (apiError.request) {
        errorMsg = "Network error. Please check your connection.";
      } else {
        errorMsg = apiError.message || errorMsg;
      }

      toast.error(errorMsg);
      console.error("Registration error:", err);
    } finally {
      setLoading(false);
    }
  };

  // ============= PROGRESS BAR WIDTH =============
  const progressWidth = `${(100 / (totalSteps - 1)) * (currentStep - 1)}%`;

  // ============= RENDER =============
  return (
    <div className="flex items-center justify-center min-h-screen px-4 py-8 bg-black">
      <div className="w-full max-w-2xl p-8 md:p-12 rounded-2xl shadow-lg bg-[#0C111C] text-gray-200">
        <h2 className="text-2xl md:text-3xl font-bold text-center mb-2">
          Organizational Registration
        </h2>
        <p className="text-center text-gray-400 text-sm mb-8">
          Step {currentStep} of {totalSteps}
        </p>

        {/* Progress Stepper */}
        <div className="mb-12">
          <div className="relative flex justify-between">
            {/* Progress Line Background */}
            <div className="absolute top-4 left-0 h-1 w-full bg-gray-700 md:top-3"></div>

            {/* Progress Line Foreground */}
            <div
              className="absolute top-4 left-0 h-1 bg-blue-500 transition-all duration-300 ease-out md:top-3"
              style={{ width: progressWidth }}
            ></div>

            {/* Step Circles */}
            {steps.map(({ step, label }) => (
              <div
                className="relative z-10 flex flex-col items-center"
                key={step}
              >
                <div
                  className={`flex h-8 w-8 items-center justify-center rounded-full border-2 transition-all duration-300 text-sm font-semibold md:h-7 md:w-7 ${
                    currentStep > step
                      ? "border-blue-500 bg-blue-500 text-white"
                      : currentStep === step
                      ? "border-blue-500 bg-blue-500 text-white scale-110"
                      : "border-gray-600 bg-[#0C111C] text-gray-400"
                  }`}
                >
                  {currentStep > step ? "✓" : step}
                </div>
                <div className="mt-3 text-xs text-center font-medium w-20 md:w-24">
                  <span
                    className={`${
                      currentStep >= step ? "text-gray-200" : "text-gray-500"
                    }`}
                  >
                    {label}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          {/* STEP 1: Company Details */}
          {currentStep === 1 && (
            <div className="space-y-5 animate-fadeIn">
              {/* Company Name */}
              <div>
                <label
                  htmlFor="companyName"
                  className="block text-sm font-medium text-gray-200 mb-2"
                >
                  Company Name <span className="text-red-500">*</span>
                </label>
                <input
                  id="companyName"
                  {...register("companyName")}
                  autoComplete="organization"
                  placeholder="e.g., Acme Corporation Ltd."
                  className="w-full border rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-[#1a1a2e] border-gray-600 text-white placeholder-gray-500 transition"
                />
                {errors.companyName && (
                  <p className="text-sm text-red-500 mt-1.5">
                    {errors.companyName.message}
                  </p>
                )}
              </div>

              {/* RC Number */}
              <div>
                <label
                  htmlFor="rcNumber"
                  className="block text-sm font-medium text-gray-200 mb-2"
                >
                  Company Registration Number (RC Number){" "}
                  <span className="text-red-500">*</span>
                </label>
                <input
                  id="rcNumber"
                  {...register("rcNumber")}
                  autoComplete="off"
                  placeholder="e.g., RC123456"
                  className="w-full border rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-[#1a1a2e] border-gray-600 text-white placeholder-gray-500 transition"
                />
                {errors.rcNumber && (
                  <p className="text-sm text-red-500 mt-1.5">
                    {errors.rcNumber.message}
                  </p>
                )}
              </div>

              {/* Industry Type */}
              <div>
                <label
                  htmlFor="industryType"
                  className="block text-sm font-medium text-gray-200 mb-2"
                >
                  Industry Type <span className="text-red-500">*</span>
                </label>
                <input
                  id="industryType"
                  {...register("industryType")}
                  autoComplete="off"
                  placeholder="e.g., Agriculture, Oil & Gas, Mining, Logistics"
                  className="w-full border rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-[#1a1a2e] border-gray-600 text-white placeholder-gray-500 transition"
                />
                {errors.industryType && (
                  <p className="text-sm text-red-500 mt-1.5">
                    {errors.industryType.message}
                  </p>
                )}
              </div>

              {/* Company Address */}
              <div>
                <label
                  htmlFor="companyAddress"
                  className="block text-sm font-medium text-gray-200 mb-2"
                >
                  Company Address <span className="text-red-500">*</span>
                </label>
                <input
                  id="companyAddress"
                  {...register("companyAddress")}
                  autoComplete="street-address"
                  placeholder="e.g., 123 Business Street, Suite 100"
                  className="w-full border rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-[#1a1a2e] border-gray-600 text-white placeholder-gray-500 transition"
                />
                {errors.companyAddress && (
                  <p className="text-sm text-red-500 mt-1.5">
                    {errors.companyAddress.message}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* STEP 2: Contact Information */}
          {currentStep === 2 && (
            <div className="space-y-5 animate-fadeIn">
              {/* Email */}
              <div>
                <label
                  htmlFor="email"
                  className="block text-sm font-medium text-gray-200 mb-2"
                >
                  Business Email Address <span className="text-red-500">*</span>
                </label>
                <input
                  id="email"
                  {...register("email")}
                  type="email"
                  autoComplete="email"
                  placeholder="e.g., contact@company.com"
                  className="w-full border rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-[#1a1a2e] border-gray-600 text-white placeholder-gray-500 transition"
                />
                {errors.email && (
                  <p className="text-sm text-red-500 mt-1.5">
                    {errors.email.message}
                  </p>
                )}
              </div>

              {/* Country */}
              <div>
                <label
                  htmlFor="country"
                  className="block text-sm font-medium text-gray-200 mb-2"
                >
                  Country of Operation <span className="text-red-500">*</span>
                </label>
                <select
                  id="country"
                  {...register("country")}
                  style={{
                    fontFamily:
                      "'Segoe UI Emoji', 'Noto Color Emoji', 'Apple Color Emoji', sans-serif",
                  }}
                  className="w-full border rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-[#1a1a2e] border-gray-600 text-white transition"
                >
                  <option value="">🌍 Select a country</option>
                  {countries.map((country) => (
                    <option key={country.code} value={country.name}>
                      {country.emoji} {country.name}
                    </option>
                  ))}
                </select>
                {errors.country && (
                  <p className="text-sm text-red-500 mt-1.5">
                    {errors.country.message}
                  </p>
                )}
              </div>

              {/* Region */}
              <div>
                <label
                  htmlFor="region"
                  className="block text-sm font-medium text-gray-200 mb-2"
                >
                  State/Region <span className="text-red-500">*</span>
                </label>
                <input
                  id="region"
                  {...register("region")}
                  autoComplete="address-level1"
                  placeholder="e.g., Lagos, California, Ontario"
                  className="w-full border rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-[#1a1a2e] border-gray-600 text-white placeholder-gray-500 transition"
                />
                {errors.region && (
                  <p className="text-sm text-red-500 mt-1.5">
                    {errors.region.message}
                  </p>
                )}
              </div>

              {/* Phone Number */}
              <div>
                <label
                  htmlFor="phoneNumber"
                  className="block text-sm font-medium text-gray-200 mb-2"
                >
                  Phone Number <span className="text-red-500">*</span>
                </label>
                <div className="flex gap-2">
                  {phoneDialCode && (
                    <div className="flex items-center px-3 py-2.5 bg-[#252533] border border-gray-600 rounded-lg text-gray-300 text-sm font-medium min-w-[70px] justify-center">
                      {phoneDialCode}
                    </div>
                  )}
                  <input
                    id="phoneNumber"
                    {...register("phoneNumber")}
                    type="tel"
                    autoComplete="tel"
                    placeholder={
                      phoneDialCode
                        ? "123 456 7890"
                        : "Enter phone number with country code"
                    }
                    className="flex-1 border rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-[#1a1a2e] border-gray-600 text-white placeholder-gray-500 transition"
                  />
                </div>
                <p className="text-xs text-gray-400 mt-1.5">
                  {phoneDialCode
                    ? "Enter your phone number without the country code"
                    : "Select a country first to auto-fill the country code"}
                </p>
                {errors.phoneNumber && (
                  <p className="text-sm text-red-500 mt-1.5">
                    {errors.phoneNumber.message}
                  </p>
                )}
              </div>

              {/* Website */}
              <div>
                <label
                  htmlFor="website"
                  className="block text-sm font-medium text-gray-200 mb-2"
                >
                  Company Website{" "}
                  <span className="text-gray-400 text-xs">(Optional)</span>
                </label>
                <input
                  id="website"
                  {...register("website")}
                  type="url"
                  autoComplete="url"
                  placeholder="e.g., https://www.company.com"
                  className="w-full border rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-[#1a1a2e] border-gray-600 text-white placeholder-gray-500 transition"
                />
                {errors.website && (
                  <p className="text-sm text-red-500 mt-1.5">
                    {errors.website.message}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* STEP 3: Account Credentials */}
          {currentStep === 3 && (
            <div className="space-y-5 animate-fadeIn">
              {/* Password */}
              <div>
                <label
                  htmlFor="password"
                  className="block text-sm font-medium text-gray-200 mb-2"
                >
                  Password <span className="text-red-500">*</span>
                </label>
                <input
                  id="password"
                  type="password"
                  {...register("password")}
                  autoComplete="new-password"
                  placeholder="Create a strong password"
                  className="w-full border rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-[#1a1a2e] border-gray-600 text-white placeholder-gray-500 transition"
                />
                <p className="text-xs text-gray-400 mt-1.5">
                  Must be at least 8 characters with uppercase, lowercase, and a
                  number
                </p>
                {errors.password && (
                  <p className="text-sm text-red-500 mt-1.5">
                    {errors.password.message}
                  </p>
                )}
              </div>

              {/* Confirm Password */}
              <div>
                <label
                  htmlFor="re_password"
                  className="block text-sm font-medium text-gray-200 mb-2"
                >
                  Confirm Password <span className="text-red-500">*</span>
                </label>
                <input
                  id="re_password"
                  type="password"
                  {...register("re_password")}
                  autoComplete="new-password"
                  placeholder="Re-enter your password"
                  className="w-full border rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-[#1a1a2e] border-gray-600 text-white placeholder-gray-500 transition"
                />
                {errors.re_password && (
                  <p className="text-sm text-red-500 mt-1.5">
                    {errors.re_password.message}
                  </p>
                )}
              </div>

              {/* Summary Info */}
              <div className="mt-6 p-4 bg-[#1a1a2e] border border-gray-700 rounded-lg">
                <h3 className="text-sm font-semibold text-gray-200 mb-3">
                  Registration Summary
                </h3>
                <div className="space-y-2 text-xs text-gray-400">
                  <div className="flex justify-between">
                    <span>Company:</span>
                    <span className="text-gray-200 font-medium">
                      {watchedData.companyName || "—"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Email:</span>
                    <span className="text-gray-200 font-medium">
                      {watchedData.email || "—"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Location:</span>
                    <span className="text-gray-200 font-medium">
                      {watchedData.region && watchedData.country
                        ? `${watchedData.region}, ${watchedData.country}`
                        : "—"}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex justify-between items-center mt-8 pt-6 border-t border-gray-700">
            {currentStep > 1 ? (
              <button
                type="button"
                onClick={prevStep}
                disabled={loading}
                className="px-5 py-2.5 border border-gray-600 rounded-lg text-gray-300 hover:text-white hover:border-gray-400 hover:bg-[#1a1a2e] transition-all disabled:opacity-50 disabled:cursor-not-allowed font-medium"
              >
                ← Previous
              </button>
            ) : (
              <div></div>
            )}

            <div className="ml-auto">
              {currentStep < totalSteps ? (
                <button
                  type="button"
                  onClick={nextStep}
                  disabled={isSubmitting || loading}
                  className="px-6 py-2.5 rounded-lg font-medium transition-all bg-blue-600 text-white hover:bg-blue-700 disabled:bg-gray-700 disabled:text-gray-500 disabled:cursor-not-allowed shadow-lg hover:shadow-xl"
                >
                  Next →
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={!isValid || isSubmitting || loading}
                  className={`px-6 py-2.5 rounded-lg font-medium transition-all shadow-lg ${
                    !isValid || isSubmitting || loading
                      ? "bg-gray-700 text-gray-500 cursor-not-allowed"
                      : "bg-blue-600 text-white hover:bg-blue-700 hover:shadow-xl"
                  }`}
                >
                  {loading ? (
                    <span className="flex items-center">
                      <svg
                        className="animate-spin h-5 w-5 mr-2"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        ></circle>
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8v0c0 4.418-3.582 8-8 8z"
                        ></path>
                      </svg>
                      Creating Account...
                    </span>
                  ) : (
                    "Create Account"
                  )}
                </button>
              )}
            </div>
          </div>
        </form>

        {/* Footer */}
        <div className="mt-8 pt-6 border-t border-gray-800 text-center">
          <p className="text-sm text-gray-400">
            Registering as an individual?{" "}
            <Link
              to="/register"
              className="font-medium text-blue-400 hover:text-blue-300 transition"
            >
              Go to Individual Registration
            </Link>
          </p>
        </div>

        {/* Clear Saved Data Button */}
        {hasLoadedSavedData && (
          <div className="mt-4 text-center">
            <button
              type="button"
              onClick={() => {
                if (
                  window.confirm(
                    "Are you sure you want to clear saved form data?"
                  )
                ) {
                  safeLocalStorage.removeItem(AUTOSAVE_KEY);
                  reset();
                  setCurrentStep(1);
                  toast.success("Form data cleared");
                }
              }}
              className="text-xs text-gray-500 hover:text-gray-300 transition"
            >
              Clear saved data
            </button>
          </div>
        )}
      </div>

      {/* Add CSS for fade-in animation */}
      <style>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out;
        }
      `}</style>
    </div>
  );
}

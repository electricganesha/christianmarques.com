import React, { useState, useRef, useEffect } from "react";
import { Send, CheckCircle, AlertCircle, RefreshCw } from "lucide-react";
import styles from "./ContactForm.module.scss";

const ContactForm = () => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
    _gotcha: "",
  });
  const [fieldErrors, setFieldErrors] = useState({});
  const [status, setStatus] = useState("idle"); // "idle" | "loading" | "success" | "error"
  const [errorMessage, setErrorMessage] = useState("");
  const [sentDetails, setSentDetails] = useState({ name: "", email: "" });

  const nameInputRef = useRef(null);
  const emailInputRef = useRef(null);
  const subjectInputRef = useRef(null);
  const messageInputRef = useRef(null);
  const successCardRef = useRef(null);
  const errorBannerRef = useRef(null);

  useEffect(() => {
    if (status === "success" && successCardRef.current) {
      successCardRef.current.focus();
    } else if (status === "error" && errorBannerRef.current) {
      errorBannerRef.current.focus();
    }
  }, [status]);

  const validateField = (name, value) => {
    const trimmed = (value || "").trim();
    switch (name) {
      case "name":
        if (!trimmed) return "Please enter your name.";
        if (trimmed.length < 2) return "Name must be at least 2 characters long.";
        if (trimmed.length > 100) return "Name cannot exceed 100 characters.";
        return "";
      case "email":
        if (!trimmed) return "Please enter your email address.";
        const emailPattern =
          /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*\.[a-zA-Z]{2,}$/;
        if (!emailPattern.test(trimmed)) {
          return "Please enter a valid email address (e.g. name@domain.com).";
        }
        if (trimmed.length > 120) return "Email address cannot exceed 120 characters.";
        return "";
      case "subject":
        if (!trimmed) return "Please enter a subject.";
        if (trimmed.length < 2) return "Subject must be at least 2 characters long.";
        if (trimmed.length > 150) return "Subject cannot exceed 150 characters.";
        return "";
      case "message":
        if (!trimmed) return "Please enter your message.";
        if (trimmed.length < 10) return "Message must be at least 10 characters long.";
        if (trimmed.length > 4000) return "Message cannot exceed 4000 characters.";
        return "";
      default:
        return "";
    }
  };

  const validateForm = () => {
    const errors = {};
    ["name", "email", "subject", "message"].forEach((field) => {
      const err = validateField(field, formData[field]);
      if (err) errors[field] = err;
    });
    return errors;
  };

  const isFormValid = Boolean(
    formData.name.trim() &&
      formData.email.trim() &&
      formData.subject.trim() &&
      formData.message.trim() &&
      !validateField("name", formData.name) &&
      !validateField("email", formData.email) &&
      !validateField("subject", formData.subject) &&
      !validateField("message", formData.message)
  );

  const handleBlur = (field) => {
    const error = validateField(field, formData[field]);
    setFieldErrors((prev) => ({
      ...prev,
      [field]: error,
    }));
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    // Clear specific field error as user types if valid
    if (fieldErrors[name]) {
      const error = validateField(name, value);
      setFieldErrors((prev) => {
        const updated = { ...prev };
        if (!error) {
          delete updated[name];
        } else {
          updated[name] = error;
        }
        return updated;
      });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Comprehensive client-side validation
    const errors = validateForm();
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);

      // Focus first field with an error
      if (errors.name && nameInputRef.current) {
        nameInputRef.current.focus();
      } else if (errors.email && emailInputRef.current) {
        emailInputRef.current.focus();
      } else if (errors.subject && subjectInputRef.current) {
        subjectInputRef.current.focus();
      } else if (errors.message && messageInputRef.current) {
        messageInputRef.current.focus();
      }
      return;
    }

    setFieldErrors({});
    setStatus("loading");
    setErrorMessage("");

    try {
      const res = await fetch("/api/contact/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to deliver message.");
      }

      // Save name & email for the success receipt before clearing
      setSentDetails({
        name: formData.name.trim(),
        email: formData.email.trim(),
      });
      setStatus("success");
      setFormData({
        name: "",
        email: "",
        subject: "",
        message: "",
        _gotcha: "",
      });
    } catch (err) {
      setStatus("error");
      setErrorMessage(
        err.message || "Something went wrong sending your message. Please try again."
      );
    }
  };

  const handleReset = () => {
    setStatus("idle");
    setFieldErrors({});
    setErrorMessage("");
  };

  return (
    <section id="contact" className={styles.contactWrapper} aria-labelledby="contact-heading">
      {status !== "success" && (
        <div className={styles.contactHeader}>
          <h2 id="contact-heading" className={styles.contactTitle}>
            Get in Touch
          </h2>
          <p className={styles.contactSubtitle}>
            Have a question, a project in mind, or an interesting challenge? Send a message directly using the form below.
          </p>
        </div>
      )}

      {status === "success" ? (
        /* Form is completely hidden once sent - only the success confirmation is shown */
        <div
          ref={successCardRef}
          tabIndex={-1}
          className={styles.successCard}
          role="status"
          aria-live="polite"
        >
          <div className={styles.successIconWrapper}>
            <CheckCircle size={36} />
          </div>
          <h3 className={styles.successHeading}>Message Delivered!</h3>
          <p className={styles.successBody}>
            Thank you, <strong>{sentDetails.name}</strong>. Your message has been sent directly to my inbox. I will review it and reply to <strong>{sentDetails.email}</strong> as soon as possible.
          </p>
          <button
            type="button"
            onClick={handleReset}
            className={styles.resetBtn}
          >
            Send another message
          </button>
        </div>
      ) : (
        /* Active Contact Form */
        <form onSubmit={handleSubmit} className={styles.contactForm} noValidate>
          {/* Anti-spam honeypot */}
          <div className={styles.honeypot} aria-hidden="true">
            <label htmlFor="contact-_gotcha">Do not fill this field</label>
            <input
              type="text"
              id="contact-_gotcha"
              name="_gotcha"
              value={formData._gotcha}
              onChange={handleChange}
              tabIndex={-1}
              autoComplete="off"
            />
          </div>

          <div className={styles.formGrid}>
            <div className={styles.fieldGroup}>
              <label htmlFor="contact-name" className={styles.label}>
                Your Name <span aria-hidden="true">*</span>
              </label>
              <input
                ref={nameInputRef}
                type="text"
                id="contact-name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                onBlur={() => handleBlur("name")}
                required
                maxLength={100}
                autoComplete="name"
                disabled={status === "loading"}
                placeholder="e.g. Ada Lovelace"
                className={`${styles.input} ${fieldErrors.name ? styles.inputError : ""}`}
                aria-invalid={fieldErrors.name ? "true" : "false"}
                aria-describedby={fieldErrors.name ? "contact-name-error" : undefined}
              />
              {fieldErrors.name && (
                <span id="contact-name-error" className={styles.fieldError}>
                  {fieldErrors.name}
                </span>
              )}
            </div>

            <div className={styles.fieldGroup}>
              <label htmlFor="contact-email" className={styles.label}>
                Email Address <span aria-hidden="true">*</span>
              </label>
              <input
                ref={emailInputRef}
                type="email"
                id="contact-email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                onBlur={() => handleBlur("email")}
                required
                maxLength={120}
                autoComplete="email"
                disabled={status === "loading"}
                placeholder="e.g. ada@example.com"
                className={`${styles.input} ${fieldErrors.email ? styles.inputError : ""}`}
                aria-invalid={fieldErrors.email ? "true" : "false"}
                aria-describedby={fieldErrors.email ? "contact-email-error" : undefined}
              />
              {fieldErrors.email && (
                <span id="contact-email-error" className={styles.fieldError}>
                  {fieldErrors.email}
                </span>
              )}
            </div>

            <div className={styles.fieldGroupFull}>
              <label htmlFor="contact-subject" className={styles.label}>
                Subject <span aria-hidden="true">*</span>
              </label>
              <input
                ref={subjectInputRef}
                type="text"
                id="contact-subject"
                name="subject"
                value={formData.subject}
                onChange={handleChange}
                onBlur={() => handleBlur("subject")}
                required
                maxLength={150}
                disabled={status === "loading"}
                placeholder="e.g. 3D WebGL Collaboration / Advisory"
                className={`${styles.input} ${fieldErrors.subject ? styles.inputError : ""}`}
                aria-invalid={fieldErrors.subject ? "true" : "false"}
                aria-describedby={fieldErrors.subject ? "contact-subject-error" : undefined}
              />
              {fieldErrors.subject && (
                <span id="contact-subject-error" className={styles.fieldError}>
                  {fieldErrors.subject}
                </span>
              )}
            </div>

            <div className={styles.fieldGroupFull}>
              <label htmlFor="contact-message" className={styles.label}>
                Message <span aria-hidden="true">*</span>
              </label>
              <textarea
                ref={messageInputRef}
                id="contact-message"
                name="message"
                value={formData.message}
                onChange={handleChange}
                onBlur={() => handleBlur("message")}
                rows={5}
                required
                maxLength={4000}
                disabled={status === "loading"}
                placeholder="Tell me about your project, ideas, or timeline..."
                className={`${styles.textarea} ${fieldErrors.message ? styles.inputError : ""}`}
                aria-invalid={fieldErrors.message ? "true" : "false"}
                aria-describedby={fieldErrors.message ? "contact-message-error" : undefined}
              />
              {fieldErrors.message && (
                <span id="contact-message-error" className={styles.fieldError}>
                  {fieldErrors.message}
                </span>
              )}
            </div>
          </div>

          <button
            type="submit"
            className={`${styles.submitBtn} ${status === "loading" ? styles.loadingBtn : ""}`}
            disabled={!isFormValid || status === "loading"}
          >
            {status === "loading" ? (
              <>
                <span className={styles.spinner} aria-hidden="true" />
                <span>Sending Message...</span>
              </>
            ) : (
              <>
                <Send size={16} />
                <span>Send Message</span>
              </>
            )}
          </button>

          <p className={styles.privacyNote}>
            Your details are used only to deliver and respond to your message. They are not used for marketing or added to a mailing list.
          </p>

          {status === "error" && (
            <div
              ref={errorBannerRef}
              tabIndex={-1}
              className={styles.errorMessage}
              role="alert"
            >
              <div className={styles.errorContent}>
                <AlertCircle size={18} className={styles.errorIcon} />
                <span>{errorMessage}</span>
              </div>
              <button
                type="button"
                onClick={handleSubmit}
                className={styles.retryBtn}
              >
                <RefreshCw size={14} />
                <span>Try Again</span>
              </button>
            </div>
          )}
        </form>
      )}
    </section>
  );
};

export default ContactForm;

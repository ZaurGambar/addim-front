import styled from "styled-components";
import { useFormik } from "formik";
import * as yup from "yup";
import { toast } from "react-toastify";
import Button from "@/components/common/Button";
import InputField from "@/components/common/InputField";
import BaseModal from "./BaseModal";

const encode = (data) => new URLSearchParams(data).toString();

// Netlify Forms: "data-report" forması index.html-də gizli şəkildə elan olunub
const ReportModal = ({ context = "", onClose }) => {
  const formik = useFormik({
    initialValues: { message: "", email: "" },
    validationSchema: yup.object({
      message: yup.string().trim().min(10, "Ən azı 10 simvol yazın").required("Xətanı təsvir edin"),
      email: yup.string().email("E-poçt düzgün deyil"),
    }),
    onSubmit: async (values, { setSubmitting }) => {
      try {
        const res = await fetch("/", {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body: encode({ "form-name": "data-report", context, ...values }),
        });
        if (!res.ok) throw new Error(String(res.status));
        toast.success("Göndərildi. Təşəkkür edirik!");
        onClose();
      } catch {
        toast.error("Göndərilmədi. Bir az sonra yenidən cəhd edin.");
      } finally {
        setSubmitting(false);
      }
    },
  });

  return (
    <BaseModal title="Data xətası bildir" onClose={onClose}>
      <Form onSubmit={formik.handleSubmit} noValidate>
        {context && <Ctx>Bölmə: {context}</Ctx>}
        <InputField
          as="textarea"
          id="report-message"
          name="message"
          label="Nə səhvdir?"
          rows={4}
          placeholder="Məs.: Bu küçə artıq piyada zonasıdır"
          value={formik.values.message}
          onChange={formik.handleChange}
          onBlur={formik.handleBlur}
          error={formik.touched.message && formik.errors.message}
        />
        <InputField
          id="report-email"
          name="email"
          type="email"
          label="E-poçt (istəyə bağlı)"
          value={formik.values.email}
          onChange={formik.handleChange}
          onBlur={formik.handleBlur}
          error={formik.touched.email && formik.errors.email}
        />
        <Button type="submit" disabled={formik.isSubmitting} full>
          {formik.isSubmitting ? "Göndərilir…" : "Göndər"}
        </Button>
      </Form>
    </BaseModal>
  );
};

export default ReportModal;

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: 14px;
`;

const Ctx = styled.p`
  font-size: 13px;
  color: var(--text-3);
`;

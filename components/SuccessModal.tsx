import { Ionicons } from "@expo/vector-icons";
import { Modal, Pressable, Text, View } from "react-native";

type Props = {
  visible: boolean;
  title: string;
  message: string;
  buttonText: string;
  onClose: () => void;
};

export default function SuccessModal({
  visible,
  title,
  message,
  buttonText,
  onClose,
}: Props) {
  return (
    <Modal transparent visible={visible} animationType="fade">
      <View
        style={{
          flex: 1,
          backgroundColor: "rgba(0,0,0,0.4)",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <View
          style={{
            width: "85%",
            backgroundColor: "#fff",
            borderRadius: 16,
            padding: 24,
            alignItems: "center",
          }}
        >
          <Ionicons
            name="checkmark-circle"
            size={64}
            color="#14710F"
            style={{ marginBottom: 12 }}
          />

          <Text
            style={{
              fontSize: 20,
              fontWeight: "700",
              marginBottom: 8,
            }}
          >
            {title}
          </Text>

          <Text
            style={{
              fontSize: 15,
              textAlign: "center",
              color: "#555",
              marginBottom: 20,
            }}
          >
            {message}
          </Text>

          <Pressable
            onPress={onClose}
            style={{
              backgroundColor: "#14710F",
              paddingVertical: 12,
              paddingHorizontal: 30,
              borderRadius: 8,
            }}
          >
            <Text style={{ color: "#fff", fontWeight: "600" }}>
              {buttonText}
            </Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

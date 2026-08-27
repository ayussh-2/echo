import React from "react";
import { View, Text, TouchableOpacity, Switch } from "react-native";
import { MessageSquare, Mail, type LucideIcon } from "lucide-react-native";
import { theme } from "../lib/theme";
import { componentStyles as styles } from "../lib/styles";

export interface WhitelistAppItem {
  id: string;
  name: string;
  icon: LucideIcon;
  color: string;
  subtext: string;
}

interface WhitelistedAppsListProps {
  apps: WhitelistAppItem[];
  whitelist: string[];
  onToggleApp: (packageId: string) => void;
}

export function WhitelistedAppsList({
  apps,
  whitelist,
  onToggleApp,
}: WhitelistedAppsListProps) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionHeader}>FORWARDED APPS</Text>
      <View style={styles.appListCard}>
        {apps.map((app, index) => {
          const isEnabled = whitelist.includes(app.id);
          const IconComponent = app.icon;
          const isLast = index === apps.length - 1;

          return (
            <View key={app.id}>
              <TouchableOpacity
                style={styles.appRow}
                onPress={() => onToggleApp(app.id)}
                activeOpacity={0.7}
              >
                <View style={[styles.appIconWrap, { backgroundColor: app.color }]}>
                  <IconComponent size={18} color="#ffffff" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.appName}>{app.name}</Text>
                  <Text style={styles.appSubtext}>{app.subtext}</Text>
                </View>
                <Switch
                  value={isEnabled}
                  onValueChange={() => onToggleApp(app.id)}
                  thumbColor="#ffffff"
                  trackColor={{ false: "#e4e4e7", true: theme.colors.primary }}
                />
              </TouchableOpacity>
              {!isLast && <View style={styles.innerDivider} />}
            </View>
          );
        })}
      </View>
    </View>
  );
}

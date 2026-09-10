package com.rgcet.admission.common;

import java.util.Arrays;
import java.util.HashSet;
import java.util.Locale;
import java.util.Set;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

public final class TextUtil {

    private static final Set<String> ACRONYMS = new HashSet<>(Arrays.asList(
            "CSE", "ECE", "EEE", "MECH", "CIVIL", "IT", "AI&DS", "AI&ML", "AIDS", "AIML",
            "BME", "MBA", "MCA", "PG", "HSC", "SSLC", "CBSE", "ISC", "DOTE", "AICTE",
            "RGCET", "JIPMER", "PEC", "RTO", "AFT", "CRC", "SIPCOT", "GH", "G.H", "G.H.",
            "OT", "OBC", "SC", "ST", "CENTAC", "TC", "USA", "UK", "UAE", "NRI", "DD", "UPI",
            "I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X", "XI", "XII"
    ));

    private static final Set<String> MINOR_WORDS = new HashSet<>(Arrays.asList(
            "and", "of", "in", "for", "the", "to", "at", "by", "on", "&"
    ));

    private static final Pattern WORD_PATTERN = Pattern.compile("(\\W*)([\\w&.]+)(\\W*)");

    private TextUtil() {
    }

    public static String upper(String value) {
        if (value == null) {
            return null;
        }
        String trimmed = value.trim();
        return trimmed.isEmpty() ? trimmed : trimmed.toUpperCase(Locale.ROOT);
    }

    public static String titleCase(String value) {
        if (value == null) {
            return null;
        }
        String trimmed = value.trim();
        if (trimmed.isEmpty()) {
            return trimmed;
        }

        String[] tokens = trimmed.split("\\s+");
        StringBuilder sb = new StringBuilder();

        for (int i = 0; i < tokens.length; i++) {
            String token = tokens[i];
            if (i > 0) {
                sb.append(" ");
            }
            sb.append(formatToken(token, i == 0 || i == tokens.length - 1));
        }

        return sb.toString();
    }

    private static String formatToken(String token, boolean isEdgeWord) {
        Matcher matcher = WORD_PATTERN.matcher(token);
        if (!matcher.matches()) {
            return token;
        }

        String prefix = matcher.group(1);
        String core = matcher.group(2);
        String suffix = matcher.group(3);

        String upperCore = core.toUpperCase(Locale.ROOT);

        // Check exact degree formats
        if (upperCore.equals("B.TECH") || upperCore.equals("BTECH")) {
            return prefix + "B.Tech" + suffix;
        }
        if (upperCore.equals("M.TECH") || upperCore.equals("MTECH")) {
            return prefix + "M.Tech" + suffix;
        }
        if (upperCore.equals("B.SC") || upperCore.equals("BSC")) {
            return prefix + "B.Sc" + suffix;
        }
        if (upperCore.equals("M.SC") || upperCore.equals("MSC")) {
            return prefix + "M.Sc" + suffix;
        }
        if (upperCore.equals("B.COM") || upperCore.equals("BCOM")) {
            return prefix + "B.Com" + suffix;
        }
        if (upperCore.equals("M.COM") || upperCore.equals("MCOM")) {
            return prefix + "M.Com" + suffix;
        }
        if (upperCore.equals("B.E") || upperCore.equals("B.E.") || upperCore.equals("BE")) {
            return prefix + "B.E." + suffix;
        }
        if (upperCore.equals("M.E") || upperCore.equals("M.E.") || upperCore.equals("ME")) {
            return prefix + "M.E." + suffix;
        }

        // Check acronyms & Roman numerals
        if (ACRONYMS.contains(upperCore)) {
            return prefix + upperCore + suffix;
        }

        String lowerCore = core.toLowerCase(Locale.ROOT);

        // Minor connecting words (if not first or last word)
        if (!isEdgeWord && MINOR_WORDS.contains(lowerCore)) {
            return prefix + (lowerCore.equals("&") ? "&" : lowerCore) + suffix;
        }

        // Hyphenated sub-words (e.g. "AI-DS", "Semi-Urban")
        if (core.contains("-")) {
            String[] subParts = core.split("-");
            StringBuilder formattedSub = new StringBuilder();
            for (int j = 0; j < subParts.length; j++) {
                if (j > 0) formattedSub.append("-");
                formattedSub.append(formatToken(subParts[j], false));
            }
            return prefix + formattedSub.toString() + suffix;
        }

        // Standard Capitalization (First letter capitalized, rest lower)
        String capitalized = Character.toUpperCase(core.charAt(0)) + core.substring(1).toLowerCase(Locale.ROOT);
        return prefix + capitalized + suffix;
    }
}

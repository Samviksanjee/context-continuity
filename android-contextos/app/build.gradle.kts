plugins {
  id("com.android.application")
  id("org.jetbrains.kotlin.android")
  id("org.jetbrains.kotlin.plugin.compose")
}

android {
  namespace = "ai.contextos"
  compileSdk = 36

  defaultConfig {
    applicationId = "ai.contextos"
    minSdk = 29
    targetSdk = 36
    versionCode = 1
    versionName = "0.1.0"
  }

  buildFeatures { compose = true; buildConfig = true }

  compileOptions {
    sourceCompatibility = JavaVersion.VERSION_17
    targetCompatibility = JavaVersion.VERSION_17
  }

  packaging { resources.excludes += "/META-INF/{AL2.0,LGPL2.1}" }
}

kotlin {
  compilerOptions { jvmTarget.set(org.jetbrains.kotlin.gradle.dsl.JvmTarget.JVM_17) }
}

dependencies {
  implementation(platform("androidx.compose:compose-bom:2025.02.00"))
  implementation("androidx.core:core-ktx:1.15.0")
  implementation("androidx.activity:activity-compose:1.10.0")
  implementation("androidx.lifecycle:lifecycle-runtime-compose:2.8.7")
  implementation("androidx.lifecycle:lifecycle-viewmodel-ktx:2.8.7")
  implementation("androidx.compose.material3:material3")
  implementation("androidx.compose.material:material-icons-extended")
  implementation("androidx.compose.ui:ui")
  implementation("androidx.compose.ui:ui-tooling-preview")
  implementation("org.jetbrains.kotlinx:kotlinx-coroutines-android:1.9.0")

  // Bundled models keep OCR available offline on devices with or without Google Play services.
  implementation("com.google.mlkit:text-recognition:16.0.1")
  implementation("com.google.mlkit:text-recognition-chinese:16.0.1")
  implementation("com.google.mlkit:text-recognition-devanagari:16.0.1")
  implementation("com.google.mlkit:text-recognition-japanese:16.0.1")
  implementation("com.google.mlkit:text-recognition-korean:16.0.1")

  debugImplementation("androidx.compose.ui:ui-tooling")
  testImplementation("junit:junit:4.13.2")
}

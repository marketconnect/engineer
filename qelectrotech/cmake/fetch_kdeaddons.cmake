# Copyright 2006 The QElectroTech Team
# This file is part of QElectroTech.
#
# QElectroTech is free software: you can redistribute it and/or modify
# it under the terms of the GNU General Public License as published by
# the Free Software Foundation, either version 2 of the License, or
# (at your option) any later version.
#
# QElectroTech is distributed in the hope that it will be useful,
# but WITHOUT ANY WARRANTY; without even the implied warranty of
# MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
# GNU General Public License for more details.
#
# You should have received a copy of the GNU General Public License
# along with QElectroTech. If not, see <http://www.gnu.org/licenses/>.

message(" - fetch_kdeaddons")

if(DEFINED BUILD_WITH_KF5)
  Include(FetchContent)

  option(BUILD_KF5 "Build KF5 libraries, use system ones otherwise" YES)

  if(BUILD_KF5)

    if(NOT DEFINED KF5_GIT_TAG)
      #https://qelectrotech.org/forum/viewtopic.php?pid=13924#p13924
      set(KF5_GIT_TAG v5.77.0)
    endif()

    # Fix stop the run autotests of kcoreaddons
    # see
    # https://invent.kde.org/frameworks/kcoreaddons/-/blob/master/CMakeLists.txt#L98
    # issue:
    # CMake Error at /usr/share/ECM/modules/ECMAddTests.cmake:89 (add_executable):
    # Cannot find source file:
    # see
    # https://qelectrotech.org/forum/viewtopic.php?pid=13929#p13929
    set(KDE_SKIP_TEST_SETTINGS "TRUE")
    set(BUILD_TESTING "0")
    FetchContent_Declare(
      ecm
      GIT_REPOSITORY https://invent.kde.org/frameworks/extra-cmake-modules.git
      GIT_TAG        ${KF5_GIT_TAG})
    FetchContent_MakeAvailable(ecm)

    FetchContent_Declare(
      kcoreaddons
      GIT_REPOSITORY https://invent.kde.org/frameworks/kcoreaddons.git
      GIT_TAG        ${KF5_GIT_TAG})
    FetchContent_MakeAvailable(kcoreaddons)

    FetchContent_Declare(
      kwidgetsaddons
      GIT_REPOSITORY https://invent.kde.org/frameworks/kwidgetsaddons.git
      GIT_TAG        ${KF5_GIT_TAG})
    FetchContent_MakeAvailable(kwidgetsaddons)
  else()
    find_package(KF5CoreAddons REQUIRED)
    find_package(KF5WidgetsAddons REQUIRED)
  endif()

  set(KF5_PRIVATE_LIBRARIES
    KF5::WidgetsAddons
    KF5::CoreAddons
    )
endif()
